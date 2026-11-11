import React, { useState } from 'react';
import { SwitchCamera, Check, Camera, ShieldCheck, Cpu, Youtube, Cloud, Radio, Link2, FileVideo, Loader2 } from 'lucide-react';
import { VideoSource } from '../types/source';

type SourceKind = 'camera' | 'youtube' | 'drive' | 'rtsp' | 'direct' | 'file';

interface CameraSettingsTabProps {
  facingMode: 'user' | 'environment';
  onChangeFacingMode: (mode: 'user' | 'environment') => void;
  fps: number;
  resolution: { width: number; height: number };
  videoSource: VideoSource;
  sourceBusy: boolean;
  sourceError: string | null;
  onLoadSourceUrl: (url: string) => void;
  onSelectSourceFile: (file: File) => void;
  onUseCamera: () => void;
}

const KIND_META: Record<Exclude<SourceKind, 'camera'>, { placeholder: string; hint: string }> = {
  youtube: { placeholder: 'https://www.youtube.com/watch?v=…', hint: 'Video is downloaded by the server (≤720p) and streamed back so detection can run on it.' },
  drive: { placeholder: 'https://drive.google.com/file/d/…/view?usp=sharing', hint: 'File must be shared as “Anyone with the link”. Downloaded by the server, then streamed.' },
  rtsp: { placeholder: 'rtsp://user:pass@192.168.1.50:554/stream', hint: 'Transcoded to HLS by the server (ffmpeg). Works with IP cameras.' },
  direct: { placeholder: 'https://example.com/video.mp4', hint: 'Direct .mp4/.webm/.mov link, or pick a local file below.' },
  file: { placeholder: '', hint: 'Plays a local file from your device. Nothing is uploaded.' },
};

export const CameraSettingsTab: React.FC<CameraSettingsTabProps> = ({
  facingMode,
  onChangeFacingMode,
  fps,
  resolution,
  videoSource,
  sourceBusy,
  sourceError,
  onLoadSourceUrl,
  onSelectSourceFile,
  onUseCamera,
}) => {
  const [kind, setKind] = useState<SourceKind>('camera');
  const [url, setUrl] = useState('');
  const isCamera = videoSource.kind === 'camera';

  const sourceKinds: Array<{ id: SourceKind; label: string; icon: typeof Camera }> = [
    { id: 'camera', label: 'Camera', icon: Camera },
    { id: 'youtube', label: 'YouTube', icon: Youtube },
    { id: 'drive', label: 'Google Drive', icon: Cloud },
    { id: 'rtsp', label: 'RTSP', icon: Radio },
    { id: 'direct', label: 'Video URL', icon: Link2 },
    { id: 'file', label: 'Local File', icon: FileVideo },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Video Source Picker */}
      <div className="flex flex-col gap-2 p-4 rounded-xl border border-slate-800 bg-slate-950/60">
        <span className="text-sm font-semibold text-white flex items-center gap-2">
          <Link2 className="w-4 h-4 text-cyan-400" />
          Video Source
        </span>
        <p className="text-xs text-slate-400">
          Detection and pose run on whatever plays here: webcam, YouTube, Google Drive, RTSP, a video link, or a local file.
        </p>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {sourceKinds.map((k) => (
            <button
              key={k.id}
              onClick={() => {
                setKind(k.id);
                if (k.id === 'camera') onUseCamera();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                kind === k.id
                  ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 ring-1 ring-cyan-500/30'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
              }`}
            >
              <k.icon className="w-3.5 h-3.5" />
              {k.label}
            </button>
          ))}
        </div>

        {kind !== 'camera' && kind !== 'file' && (
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex gap-2">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && url.trim()) onLoadSourceUrl(url.trim()); }}
                placeholder={KIND_META[kind].placeholder}
                className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => url.trim() && onLoadSourceUrl(url.trim())}
                disabled={sourceBusy || !url.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-xs font-medium text-white transition-all cursor-pointer"
              >
                {sourceBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {sourceBusy ? 'Loading…' : 'Load Video'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">{KIND_META[kind].hint}</p>
          </div>
        )}

        {kind === 'file' && (
          <div className="mt-2">
            <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-slate-700 bg-slate-900 text-xs text-slate-300 hover:border-cyan-500/60 hover:text-white transition-all cursor-pointer">
              <FileVideo className="w-4 h-4 text-cyan-400" />
              Choose a video file from your device…
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onSelectSourceFile(f);
                }}
              />
            </label>
            <p className="text-[11px] text-slate-500 mt-2">{KIND_META.file.hint}</p>
          </div>
        )}

        {sourceError && (
          <p className="text-xs text-red-300 bg-red-950/40 border border-red-500/30 rounded-lg px-3 py-2 mt-1">{sourceError}</p>
        )}
        {!isCamera && videoSource.kind === 'url' && !sourceError && (
          <p className="text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 rounded-lg px-3 py-2 mt-1 truncate">
            Now playing: {videoSource.title}
          </p>
        )}
      </div>

      {/* Camera Selection: Front vs Rear */}
      <div className="flex flex-col gap-2 p-4 rounded-xl border border-slate-800 bg-slate-950/60">
        <span className="text-sm font-semibold text-white flex items-center gap-2">
          <SwitchCamera className="w-4 h-4 text-cyan-400" />
          Camera Facing Direction
        </span>
        <p className="text-xs text-slate-400 mb-2">
          Choose which camera device to use for live real-time detection stream.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => onChangeFacingMode('user')}
            className={`flex items-center justify-between p-3.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
              facingMode === 'user'
                ? 'border-cyan-500 bg-cyan-950/30 text-cyan-300 font-semibold shadow-sm ring-1 ring-cyan-500/30'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="font-semibold text-white">Front Camera</div>
              <div className="text-[11px] text-slate-400 mt-0.5">User-facing selfie camera</div>
            </div>
            {facingMode === 'user' && <Check className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            onClick={() => onChangeFacingMode('environment')}
            className={`flex items-center justify-between p-3.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
              facingMode === 'environment'
                ? 'border-cyan-500 bg-cyan-950/30 text-cyan-300 font-semibold shadow-sm ring-1 ring-cyan-500/30'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="font-semibold text-white">Rear Camera</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Environment / outward back camera</div>
            </div>
            {facingMode === 'environment' && <Check className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Live Stream Status Card */}
      <div className="flex flex-col gap-3 p-4 rounded-xl border border-slate-800 bg-slate-950/60">
        <span className="text-sm font-semibold text-white flex items-center gap-2">
          <Camera className="w-4 h-4 text-emerald-400" />
          Live Stream Specifications
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              Stream Source
            </span>
            <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Device Camera
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              Active Resolution
            </span>
            <span className="font-semibold text-white tabular-nums">
              {resolution.width} x {resolution.height}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              Processing Rate
            </span>
            <span className="font-semibold text-cyan-400 tabular-nums">
              {fps} FPS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>{videoSource.kind === 'camera' ? 'Camera stream is processed in real time. Server GPU models receive frames over /api.' : 'Link sources are fetched/transcoded by this server, then streamed back for detection.'}</span>
        </div>
      </div>
    </div>
  );
};
