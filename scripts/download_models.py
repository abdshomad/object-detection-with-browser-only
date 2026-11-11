#!/usr/bin/env python3
"""Download YOLO26 and Roboflow RF-DETR detection models into ``models/``.

Both families are fetched as native checkpoints (.pt / .pth) for server-side
GPU inference, and also exported to ONNX for portability. Files land flat in
the output directory:

    models/yolo26{n,s,m,l,x}.pt / .onnx
    models/rf-detr-{nano,small,medium,large}.pth / .onnx

Existing files are skipped unless ``--force`` is given.

Usage:
    python3 scripts/download_models.py                      # everything
    python3 scripts/download_models.py --family yolo26 --yolo-variants n,s
    python3 scripts/download_models.py --family rf-detr --rf-variants nano
    python3 scripts/download_models.py --no-onnx            # checkpoints only

Requires: ultralytics and rfdetr (pip install ultralytics rfdetr).
"""
import argparse
import shutil
import sys
from pathlib import Path

YOLO_VARIANTS = ["n", "s", "m", "l", "x"]
RF_VARIANTS = {
    "nano": ("RFDETRNano", 384),
    "small": ("RFDETRSmall", 512),
    "medium": ("RFDETRMedium", 576),
    "large": ("RFDETRLarge", 704),
}


def download_yolo(variants, out_dir: Path, imgsz: int, export_onnx: bool, force: bool) -> None:
    from ultralytics import YOLO

    for v in variants:
        pt = out_dir / f"yolo26{v}.pt"
        onnx = out_dir / f"yolo26{v}.onnx"
        if pt.exists() and not force:
            print(f"[yolo26] skip download {pt.name} (exists)")
        else:
            print(f"[yolo26] downloading yolo26{v}.pt ...", flush=True)
            YOLO(f"yolo26{v}.pt")  # auto-downloads next to cwd
            src = Path(f"yolo26{v}.pt")
            if src.resolve() != pt.resolve():
                shutil.move(str(src), str(pt))
        if not export_onnx:
            continue
        if onnx.exists() and not force:
            print(f"[yolo26] skip export {onnx.name} (exists)")
        else:
            print(f"[yolo26] exporting {onnx.name} (imgsz={imgsz}) ...", flush=True)
            YOLO(str(pt)).export(format="onnx", imgsz=imgsz, dynamic=False, simplify=True, opset=17)


def download_rfdetr(variants, out_dir: Path, export_onnx: bool, force: bool) -> None:
    import tempfile

    import rfdetr

    for name in variants:
        cls_name, _res = RF_VARIANTS[name]
        pth = out_dir / f"rf-detr-{name}.pth"
        onnx = out_dir / f"rf-detr-{name}.onnx"
        print(f"[rf-detr] loading {cls_name} (downloads weights on first run) ...", flush=True)
        model = getattr(rfdetr, cls_name)()
        src = Path(model.model_config.pretrain_weights)
        if pth.exists() and not force:
            print(f"[rf-detr] skip copy {pth.name} (exists)")
        else:
            shutil.copy2(str(src), str(pth))
            print(f"[rf-detr] saved {pth.name} ({pth.stat().st_size / 1e6:.1f} MB)")
        if not export_onnx:
            continue
        if onnx.exists() and not force:
            print(f"[rf-detr] skip export {onnx.name} (exists)")
            continue
        print(f"[rf-detr] exporting {onnx.name} ...", flush=True)
        with tempfile.TemporaryDirectory() as tmp:
            model.export(output_dir=tmp, format="onnx", fp16=False, opset_version=17, verbose=False)
            exported = sorted(Path(tmp).rglob("*.onnx"))
            if not exported:
                raise RuntimeError(f"RF-DETR export produced no .onnx in {tmp}")
            main = exported[0]
            # Move sidecar files (e.g. external .onnx.data) unchanged, rename main graph.
            for f in Path(tmp).rglob("*"):
                if f.is_file() and f != main:
                    shutil.move(str(f), str(out_dir / f.name))
            shutil.move(str(main), str(onnx))
        print(f"[rf-detr] saved {onnx.name} ({onnx.stat().st_size / 1e6:.1f} MB)")


def download_yolo_pose(variants, out_dir: Path, force: bool) -> None:
    from ultralytics import YOLO

    for v in variants:
        pt = out_dir / f"yolo26{v}-pose.pt"
        if pt.exists() and not force:
            print(f"[yolo26-pose] skip download {pt.name} (exists)")
            continue
        print(f"[yolo26-pose] downloading yolo26{v}-pose.pt ...", flush=True)
        YOLO(f"yolo26{v}-pose.pt")
        src = Path(f"yolo26{v}-pose.pt")
        if src.resolve() != pt.resolve():
            shutil.move(str(src), str(pt))


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--family", choices=["all", "yolo26", "rf-detr", "pose"], default="all")
    ap.add_argument("--yolo-variants", default=",".join(YOLO_VARIANTS), help="comma list of n,s,m,l,x")
    ap.add_argument("--rf-variants", default=",".join(RF_VARIANTS), help="comma list of nano,small,medium,large")
    ap.add_argument("--output-dir", default="models")
    ap.add_argument("--imgsz", type=int, default=640, help="YOLO26 ONNX export input size")
    ap.add_argument("--no-onnx", action="store_true", help="checkpoints only, skip ONNX export")
    ap.add_argument("--force", action="store_true", help="re-download / re-export existing files")
    args = ap.parse_args()

    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    yolo_vars = [v.strip() for v in args.yolo_variants.split(",") if v.strip()]
    rf_vars = [v.strip() for v in args.rf_variants.split(",") if v.strip()]
    bad = [v for v in yolo_vars if v not in YOLO_VARIANTS] + [v for v in rf_vars if v not in RF_VARIANTS]
    if bad:
        ap.error(f"unknown variants: {bad}")

    if args.family in ("all", "yolo26"):
        download_yolo(yolo_vars, out_dir, args.imgsz, not args.no_onnx, args.force)
    if args.family in ("all", "rf-detr"):
        download_rfdetr(rf_vars, out_dir, not args.no_onnx, args.force)
    if args.family in ("all", "pose"):
        download_yolo_pose(yolo_vars, out_dir, args.force)

    print("\nmodels/ contents:")
    for f in sorted(out_dir.iterdir()):
        if f.is_file():
            print(f"  {f.name:28s} {f.stat().st_size / 1e6:8.1f} MB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
