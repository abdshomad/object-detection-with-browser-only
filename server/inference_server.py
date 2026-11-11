"""GPU inference server for server-hosted detection models.

Serves YOLO26 (Ultralytics) and RF-DETR (Roboflow) variants from ``models/``
on the local GPU. The browser uploads a JPEG frame; the selected model runs
on CUDA and bounding boxes come back as JSON.

Endpoints:
    GET  /health                 -> {status, device, gpu, loaded[]}
    GET  /api/models             -> catalog of models present in models/
    POST /api/warmup/{model_id}  -> load model onto GPU, {loaded, loadMs}
    POST /api/detect/{model_id}  -> multipart `frame` image + ?confidence&max_detections

Run:  python3 -m uvicorn server.inference_server:app --host 127.0.0.1 --port 4056
"""
import io
import threading
import time
from pathlib import Path

import torch
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from PIL import Image

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB per frame is plenty for a webcam JPEG

ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT / "models"
DEVICE = "cuda:0" if torch.cuda.is_available() else "cpu"

# id -> (family, checkpoint filename, display name)
CATALOG = {
    **{f"yolo26{v}": ("yolo26", f"yolo26{v}.pt", f"YOLO26{v}") for v in "nsmlx"},
    "rf-detr-nano": ("rf-detr", "rf-detr-nano.pth", "RF-DETR Nano"),
    "rf-detr-small": ("rf-detr", "rf-detr-small.pth", "RF-DETR Small"),
    "rf-detr-medium": ("rf-detr", "rf-detr-medium.pth", "RF-DETR Medium"),
    "rf-detr-large": ("rf-detr", "rf-detr-large.pth", "RF-DETR Large"),
}
RF_CLASSES = {"rf-detr-nano": "RFDETRNano", "rf-detr-small": "RFDETRSmall",
              "rf-detr-medium": "RFDETRMedium", "rf-detr-large": "RFDETRLarge"}

# RF-DETR returns sparse COCO category ids (1-90 with gaps), not list positions.
COCO_ID_TO_NAME = {
    1: "person", 2: "bicycle", 3: "car", 4: "motorcycle", 5: "airplane", 6: "bus",
    7: "train", 8: "truck", 9: "boat", 10: "traffic light", 11: "fire hydrant",
    13: "stop sign", 14: "parking meter", 15: "bench", 16: "bird", 17: "cat",
    18: "dog", 19: "horse", 20: "sheep", 21: "cow", 22: "elephant", 23: "bear",
    24: "zebra", 25: "giraffe", 27: "backpack", 28: "umbrella", 31: "handbag",
    32: "tie", 33: "suitcase", 34: "frisbee", 35: "skis", 36: "snowboard",
    37: "sports ball", 38: "kite", 39: "baseball bat", 40: "baseball glove",
    41: "skateboard", 42: "surfboard", 43: "tennis racket", 44: "bottle",
    46: "wine glass", 47: "cup", 48: "fork", 49: "knife", 50: "spoon", 51: "bowl",
    52: "banana", 53: "apple", 54: "sandwich", 55: "orange", 56: "broccoli",
    57: "carrot", 58: "hot dog", 59: "pizza", 60: "donut", 61: "cake", 62: "chair",
    63: "couch", 64: "potted plant", 65: "bed", 67: "dining table", 70: "toilet",
    72: "tv", 73: "laptop", 74: "mouse", 75: "remote", 76: "keyboard",
    77: "cell phone", 78: "microwave", 79: "oven", 80: "toaster", 81: "sink",
    82: "refrigerator", 84: "book", 85: "clock", 86: "vase", 87: "scissors",
    88: "teddy bear", 89: "hair drier", 90: "toothbrush",
}

app = FastAPI(title="Server GPU Detection")
_lock = threading.Lock()
_loaded: dict[str, object] = {}


def _load(model_id: str):
    if model_id in _loaded:
        return _loaded[model_id]
    if model_id not in CATALOG:
        raise HTTPException(404, f"unknown model: {model_id}")
    family, filename, _name = CATALOG[model_id]
    ckpt = MODELS_DIR / filename
    if not ckpt.exists():
        raise HTTPException(404, f"checkpoint missing: models/{filename} (run scripts/download_models.py)")
    if family == "yolo26":
        from ultralytics import YOLO

        model = YOLO(str(ckpt))
        model.to(DEVICE)
    else:
        import rfdetr

        model = getattr(rfdetr, RF_CLASSES[model_id])()
        if hasattr(model, "optimize_for_inference"):
            model.optimize_for_inference()
    _loaded[model_id] = model
    return model


@app.get("/health")
def health():
    gpu = torch.cuda.get_device_name(0) if torch.cuda.is_available() else None
    return {"status": "ok", "device": DEVICE, "gpu": gpu, "loaded": sorted(_loaded)}


@app.get("/api/models")
def list_models():
    return [
        {"id": mid, "family": fam, "name": name, "file": f"models/{fn}",
         "available": (MODELS_DIR / fn).exists(), "loaded": mid in _loaded}
        for mid, (fam, fn, name) in CATALOG.items()
    ]


@app.post("/api/detect/{model_id}")
async def detect(model_id: str, frame: UploadFile = File(...),
                 confidence: float = Query(0.5, ge=0.0, le=1.0),
                 max_detections: int = Query(10, ge=1, le=100)):
    if model_id not in CATALOG:
        raise HTTPException(404, f"unknown model: {model_id}")
    raw = await frame.read()
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, f"frame too large: {len(raw)} bytes (max {MAX_UPLOAD_BYTES})")
    if not raw:
        raise HTTPException(400, "empty frame upload")
    try:
        img = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception:
        raise HTTPException(400, "frame is not a valid image")
    w, h = img.size
    t0 = time.perf_counter()
    objects: list[dict] = []
    with _lock:
        model = _load(model_id)
        family = CATALOG[model_id][0]
        if family == "yolo26":
            res = model.predict(img, conf=confidence, device=DEVICE, verbose=False)[0]
            names = res.names
            for box in res.boxes[:max_detections]:
                x1, y1, x2, y2 = (float(v) for v in box.xyxy[0].tolist())
                objects.append({
                    "class": names[int(box.cls[0])],
                    "score": round(float(box.conf[0]), 3),
                    "bbox": [round(x1), round(y1), round(x2 - x1), round(y2 - y1)],
                })
        else:
            det = model.predict(img, threshold=confidence)
            if isinstance(det, tuple):  # older rfdetr returns (detections, ...)
                det = det[0]
            xyxy = det.xyxy.tolist() if det.xyxy is not None else []
            confs = det.confidence.tolist() if det.confidence is not None else []
            cls_ids = det.class_id.tolist() if det.class_id is not None else []
            order = sorted(range(len(confs)), key=lambda i: -confs[i])[:max_detections]
            for i in order:
                x1, y1, x2, y2 = xyxy[i]
                cid = int(cls_ids[i])
                label = COCO_ID_TO_NAME.get(cid, str(cid))
                objects.append({
                    "class": label, "score": round(float(confs[i]), 3),
                    "bbox": [round(x1), round(y1), round(x2 - x1), round(y2 - y1)],
                })
    return {"model": model_id, "device": DEVICE, "width": w, "height": h,
            "latencyMs": round((time.perf_counter() - t0) * 1000), "objects": objects}

# ---------------------------------------------------------------------------
# Pose models (server GPU): YOLO26-Pose variants + RF-DETR Keypoint.
# MediaPipe pose stays in the browser; these run here on CUDA.
# ---------------------------------------------------------------------------
POSE_CATALOG = {
    **{f"yolo26{v}-pose": ("yolo-pose", f"yolo26{v}-pose.pt", f"YOLO26{v} Pose") for v in "nsmlx"},
    "rf-detr-pose": ("rf-pose", "rf-detr-keypoint-preview-xlarge.pth", "RF-DETR Pose (Keypoint XLarge)"),
}
_loaded_pose: dict[str, object] = {}

COCO17_NAMES = ["nose", "left_eye", "right_eye", "left_ear", "right_ear",
                "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
                "left_wrist", "right_wrist", "left_hip", "right_hip",
                "left_knee", "right_knee", "left_ankle", "right_ankle"]


def _load_pose(pose_id: str):
    if pose_id in _loaded_pose:
        return _loaded_pose[pose_id]
    if pose_id not in POSE_CATALOG:
        raise HTTPException(404, f"unknown pose model: {pose_id}")
    family, filename, _name = POSE_CATALOG[pose_id]
    if family == "yolo-pose":
        from ultralytics import YOLO

        ckpt = MODELS_DIR / filename
        if not ckpt.exists():
            raise HTTPException(404, f"checkpoint missing: models/{filename}")
        model = YOLO(str(ckpt))
        model.to(DEVICE)
    else:
        from rfdetr import RFDETRKeypointPreview

        model = RFDETRKeypointPreview()
    _loaded_pose[pose_id] = model
    return model


@app.get("/api/pose-models")
def list_pose_models():
    return [{"id": pid, "family": fam, "name": name, "loaded": pid in _loaded_pose}
            for pid, (fam, _fn, name) in POSE_CATALOG.items()]


@app.post("/api/warmup/{model_id}")
def warmup_any(model_id: str):
    # Overrides the detection-only warmup above for pose ids as well.
    t0 = time.perf_counter()
    with _lock:
        if model_id in POSE_CATALOG:
            _load_pose(model_id)
        elif model_id in CATALOG:
            _load(model_id)
        else:
            raise HTTPException(404, f"unknown model: {model_id}")
    return {"id": model_id, "loaded": True, "device": DEVICE,
            "loadMs": round((time.perf_counter() - t0) * 1000)}


@app.post("/api/pose/{pose_id}")
async def pose(pose_id: str, frame: UploadFile = File(...),
               confidence: float = Query(0.35, ge=0.0, le=1.0),
               max_detections: int = Query(10, ge=1, le=50)):
    if pose_id not in POSE_CATALOG:
        raise HTTPException(404, f"unknown pose model: {pose_id}")
    raw = await frame.read()
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "frame too large")
    try:
        img = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception:
        raise HTTPException(400, "frame is not a valid image")
    w, h = img.size
    t0 = time.perf_counter()
    poses: list[dict] = []
    with _lock:
        model = _load_pose(pose_id)
        family = POSE_CATALOG[pose_id][0]
        if family == "yolo-pose":
            res = model.predict(img, conf=confidence, device=DEVICE, verbose=False)[0]
            if res.keypoints is not None and res.keypoints.xy is not None:
                xy = res.keypoints.xy.tolist()
                conf = res.keypoints.conf.tolist() if res.keypoints.conf is not None else [[1.0] * 17] * len(xy)
                boxes = res.boxes
                for i, pts in enumerate(xy[:max_detections]):
                    score = float(boxes.conf[i]) if boxes is not None and len(boxes) > i else 1.0
                    bbox = None
                    if boxes is not None and len(boxes) > i:
                        x1, y1, x2, y2 = (float(v) for v in boxes.xyxy[i].tolist())
                        bbox = [round(x1), round(y1), round(x2 - x1), round(y2 - y1)]
                    poses.append({
                        "label": f"Person Pose #{i + 1}", "score": round(score, 3), "bbox": bbox,
                        "keypoints": [{"x": round(float(x), 1), "y": round(float(y), 1),
                                       "score": round(float(conf[i][j]), 3), "name": COCO17_NAMES[j]}
                                      for j, (x, y) in enumerate(pts)],
                    })
        else:
            out = model.predict(img, threshold=confidence)
            kp = out[0] if isinstance(out, tuple) else out
            xy = kp.xy.tolist() if kp.xy is not None else []
            det_conf = kp.detection_confidence.tolist() if getattr(kp, "detection_confidence", None) is not None else [1.0] * len(xy)
            kp_conf = kp.keypoint_confidence.tolist() if getattr(kp, "keypoint_confidence", None) is not None else [[1.0] * 17] * len(xy)
            xyxy = kp.data.get("xyxy")
            xyxy = xyxy.tolist() if xyxy is not None else [None] * len(xy)
            order = sorted(range(len(xy)), key=lambda i: -det_conf[i])[:max_detections]
            for rank, i in enumerate(order):
                box = xyxy[i]
                bbox = [round(box[0]), round(box[1]), round(box[2] - box[0]), round(box[3] - box[1])] if box else None
                poses.append({
                    "label": f"Person Pose #{rank + 1}", "score": round(float(det_conf[i]), 3), "bbox": bbox,
                    "keypoints": [{"x": round(float(x), 1), "y": round(float(y), 1),
                                   "score": round(float(kp_conf[i][j]), 3), "name": COCO17_NAMES[j]}
                                  for j, (x, y) in enumerate(xy[i])],
                })
    return {"model": pose_id, "device": DEVICE, "width": w, "height": h,
            "latencyMs": round((time.perf_counter() - t0) * 1000), "poses": poses}

# ---------------------------------------------------------------------------
# Video sources: resolve YouTube / Google Drive / direct video URLs by
# downloading to data/sources/ and streaming back same-origin (so the
# browser <video> can feed detection). RTSP is transcoded to HLS by ffmpeg.
# ---------------------------------------------------------------------------
import hashlib
import json as _json
import re as _re
import subprocess as _subprocess
from urllib.parse import urlparse as _urlparse

from fastapi.responses import FileResponse as _FileResponse
from pydantic import BaseModel as _BaseModel

SOURCE_DIR = ROOT / "data" / "sources"
SOURCE_DIR.mkdir(parents=True, exist_ok=True)
MAX_SOURCE_BYTES = 1 * 1024 * 1024 * 1024  # 1 GB per source video
YOUTUBE_HOSTS = {"youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"}
DRIVE_HOSTS = {"drive.google.com", "docs.google.com"}
DIRECT_EXTS = (".mp4", ".webm", ".mov", ".m4v", ".mkv")
_rtsp_procs: dict[str, _subprocess.Popen] = {}


class SourceResolveRequest(_BaseModel):
    url: str


def _source_id(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()[:16]


def _find_source_file(sid: str):
    for f in sorted(SOURCE_DIR.glob(f"{sid}.*")):
        if f.suffix not in (".json", ".part") and f.is_file():
            return f
    return None


def _download_stream(url: str, dest: Path) -> int:
    import requests

    total = 0
    with requests.get(url, stream=True, timeout=60, allow_redirects=True,
                      headers={"User-Agent": "Mozilla/5.0"}) as r:
        r.raise_for_status()
        with open(dest, "wb") as fh:
            for chunk in r.iter_content(chunk_size=1 << 20):
                total += len(chunk)
                if total > MAX_SOURCE_BYTES:
                    fh.close(); dest.unlink(missing_ok=True)
                    raise HTTPException(413, "source video exceeds 1 GB limit")
                fh.write(chunk)
    return total


def _download_drive(file_id: str, dest: Path) -> int:
    import requests

    session = requests.Session()
    url = f"https://drive.usercontent.google.com/download?id={file_id}&export=download&confirm=t"
    total = 0
    with session.get(url, stream=True, timeout=60, headers={"User-Agent": "Mozilla/5.0"}) as r:
        r.raise_for_status()
        ctype = r.headers.get("content-type", "")
        if "text/html" in ctype:
            raise HTTPException(502, "Google Drive did not return a video file (file may not be publicly shared)")
        with open(dest, "wb") as fh:
            for chunk in r.iter_content(chunk_size=1 << 20):
                total += len(chunk)
                if total > MAX_SOURCE_BYTES:
                    fh.close(); dest.unlink(missing_ok=True)
                    raise HTTPException(413, "source video exceeds 1 GB limit")
                fh.write(chunk)
    return total


@app.post("/api/source/resolve")
def resolve_source(req: SourceResolveRequest):
    url = req.url.strip()
    parsed = _urlparse(url)
    host = (parsed.hostname or "").lower()
    sid = _source_id(url)

    # RTSP: start (or reuse) an ffmpeg -> HLS transcode.
    if parsed.scheme in ("rtsp", "rtsps"):
        hls_dir = SOURCE_DIR / sid
        playlist = hls_dir / "index.m3u8"
        if sid not in _rtsp_procs or _rtsp_procs[sid].poll() is not None:
            hls_dir.mkdir(parents=True, exist_ok=True)
            for old in hls_dir.glob("*"):
                old.unlink(missing_ok=True)
            _rtsp_procs[sid] = _subprocess.Popen(
                ["ffmpeg", "-nostdin", "-rtsp_transport", "tcp", "-i", url,
                 "-c:v", "libx264", "-preset", "veryfast", "-tune", "zerolatency",
                 "-c:a", "aac", "-f", "hls", "-hls_time", "1", "-hls_list_size", "8",
                 "-hls_flags", "delete_segments+append_list", str(playlist)],
                stdout=_subprocess.DEVNULL, stderr=_subprocess.DEVNULL)
        return {"id": sid, "type": "rtsp", "title": f"RTSP stream ({host})",
                "streamUrl": f"/api/source/hls/{sid}/index.m3u8", "cached": playlist.exists()}

    if parsed.scheme not in ("http", "https"):
        raise HTTPException(400, "URL must start with http://, https://, or rtsp://")
    is_youtube = host in YOUTUBE_HOSTS
    is_drive = host in DRIVE_HOSTS
    is_direct = parsed.path.lower().endswith(DIRECT_EXTS)
    if not (is_youtube or is_drive or is_direct):
        raise HTTPException(400, "Unsupported source: use a YouTube link, Google Drive link, RTSP URL, or direct .mp4/.webm/.mov link")

    existing = _find_source_file(sid)
    meta_path = SOURCE_DIR / f"{sid}.json"
    if existing is not None:
        meta = _json.loads(meta_path.read_text()) if meta_path.exists() else {}
        return {"id": sid, "type": meta.get("type", "direct"), "title": meta.get("title", existing.name),
                "streamUrl": f"/api/source/stream/{sid}", "sizeBytes": existing.stat().st_size, "cached": True}

    stype = "youtube" if is_youtube else "drive" if is_drive else "direct"
    title = url
    try:
        if is_youtube:
            import os as _os

            import yt_dlp

            tmp_tmpl = str(SOURCE_DIR / f"{sid}.%(ext)s")
            base_opts = {"format": "best[height<=720][ext=mp4]/best[height<=720]/best",
                         "outtmpl": tmp_tmpl, "merge_output_format": "mp4",
                         "noplaylist": True, "quiet": True, "socket_timeout": 30, "retries": 3}
            cookies = _os.environ.get("YTDLP_COOKIES", "")
            if cookies and Path(cookies).exists():
                base_opts["cookiefile"] = cookies
            last_err = None
            # YouTube often 403s datacenter IPs; try a few player clients.
            for client in (None, "android_vr", "web_safari", "mweb"):
                opts = dict(base_opts)
                if client:
                    opts["extractor_args"] = {"youtube": {"player_client": [client]}}
                try:
                    with yt_dlp.YoutubeDL(opts) as ydl:
                        info = ydl.extract_info(url, download=True)
                        title = info.get("title") or title
                    last_err = None
                    break
                except Exception as exc:
                    last_err = exc
            if last_err is not None:
                raise HTTPException(502, "YouTube blocked this download (common for server IPs). "
                                         "Try a Google Drive / direct video link, or set YTDLP_COOKIES "
                                         f"to a cookies.txt path on the server. Detail: {str(last_err)[:200]}")
            media = _find_source_file(sid)
            if media is None:
                raise HTTPException(502, "YouTube download produced no file")
        elif is_drive:
            m = _re.search(r"/file/d/([-\w]{10,})", url) or _re.search(r"[?&]id=([-\w]{10,})", url)
            if not m:
                raise HTTPException(400, "Could not find a file ID in that Google Drive link")
            dest = SOURCE_DIR / f"{sid}.mp4.part"
            _download_drive(m.group(1), dest)
            dest.rename(SOURCE_DIR / f"{sid}.mp4")
            title = f"Google Drive video ({m.group(1)[:8]}…)"
            media = SOURCE_DIR / f"{sid}.mp4"
        else:
            ext = Path(parsed.path).suffix.lower() or ".mp4"
            dest = SOURCE_DIR / f"{sid}{ext}.part"
            _download_stream(url, dest)
            dest.rename(SOURCE_DIR / f"{sid}{ext}")
            title = Path(parsed.path).name or title
            media = SOURCE_DIR / f"{sid}{ext}"
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(502, f"Failed to fetch source video: {str(exc)[:300]}")

    meta_path.write_text(_json.dumps({"type": stype, "title": title, "url": url}))
    return {"id": sid, "type": stype, "title": title,
            "streamUrl": f"/api/source/stream/{sid}", "sizeBytes": media.stat().st_size, "cached": False}


@app.get("/api/source/stream/{source_id}")
def stream_source(source_id: str):
    if not _re.fullmatch(r"[a-f0-9]{16}", source_id):
        raise HTTPException(404, "unknown source")
    media = _find_source_file(source_id)
    if media is None:
        raise HTTPException(404, "source not found (resolve it first)")
    return _FileResponse(str(media))


@app.get("/api/source/hls/{source_id}/{filename}")
def stream_hls(source_id: str, filename: str):
    if not _re.fullmatch(r"[a-f0-9]{16}", source_id) or "/" in filename or "\\" in filename:
        raise HTTPException(404, "unknown stream")
    target = SOURCE_DIR / source_id / filename
    if not target.is_file():
        raise HTTPException(404, "segment not ready yet")
    media_type = "application/vnd.apple.mpegurl" if filename.endswith(".m3u8") else "video/MP2T"
    return _FileResponse(str(target), media_type=media_type)


@app.post("/api/source/stop/{source_id}")
def stop_source(source_id: str):
    proc = _rtsp_procs.pop(source_id, None)
    if proc and proc.poll() is None:
        proc.terminate()
    return {"id": source_id, "stopped": proc is not None}
