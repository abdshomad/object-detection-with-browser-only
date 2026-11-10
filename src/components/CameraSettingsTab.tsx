import React from 'react';
import { SwitchCamera, Check, Camera, ShieldCheck, Cpu } from 'lucide-react';

interface CameraSettingsTabProps {
  facingMode: 'user' | 'environment';
  onChangeFacingMode: (mode: 'user' | 'environment') => void;
  fps: number;
  resolution: { width: number; height: number };
}

export const CameraSettingsTab: React.FC<CameraSettingsTabProps> = ({
  facingMode,
  onChangeFacingMode,
  fps,
  resolution,
}) => {
  return (
    <div className="flex flex-col gap-5">
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
          <span>Camera stream is processed 100% on-device in real time with private browser execution.</span>
        </div>
      </div>
    </div>
  );
};
