import React from 'react';
import { SwitchCamera, Settings, Camera, Box, User, Sparkles, Eye } from 'lucide-react';
import { DetectionMode, PoseVariant } from '../types/pose';
import { useAutoAutoHide } from '../hooks/useAutoAutoHide';

interface MainScreenOverlayProps {
  facingMode: 'user' | 'environment';
  onToggleFacingMode: () => void;
  modelName: string;
  activeCount: number;
  activePoseCount?: number;
  detectionMode: DetectionMode;
  onChangeDetectionMode: (mode: DetectionMode) => void;
  activePoseVariant: PoseVariant;
  onCyclePoseVariant: () => void;
  onOpenSettings: () => void;
  onTakeSnapshot: () => void;
  isSettingsOpen?: boolean;
}

export const MainScreenOverlay: React.FC<MainScreenOverlayProps> = ({
  facingMode,
  onToggleFacingMode,
  modelName,
  activeCount,
  activePoseCount = 0,
  detectionMode,
  onChangeDetectionMode,
  activePoseVariant,
  onCyclePoseVariant,
  onOpenSettings,
  onTakeSnapshot,
  isSettingsOpen = false,
}) => {
  // Auto-hide buttons after 3 seconds of user inactivity
  const { isVisible, showControls } = useAutoAutoHide(3000, isSettingsOpen);

  return (
    <div
      onClick={showControls}
      className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-3 sm:p-5 select-none"
    >
      {/* Top minimal status bar: Model, Mode Selector & Camera Flip */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 w-full transition-all duration-300 ${
          isVisible
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        {/* Left: Model Name & Camera Mode */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-medium tracking-tight">
            {modelName}
          </span>
          <span className="text-white/40">·</span>
          <span className="text-[11px] font-mono text-cyan-300 uppercase">
            {facingMode === 'user' ? 'Front' : 'Rear'}
          </span>
        </div>

        {/* Center: Stream Mode Switcher (Box / Pose / Both) */}
        <div className="flex items-center p-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-xs shadow-lg">
          <button
            onClick={() => {
              showControls();
              onChangeDetectionMode('objects');
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer ${
              detectionMode === 'objects'
                ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Boxes</span>
          </button>
          <button
            onClick={() => {
              showControls();
              onChangeDetectionMode('pose');
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer ${
              detectionMode === 'pose'
                ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Pose</span>
          </button>
          <button
            onClick={() => {
              showControls();
              onChangeDetectionMode('both');
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer ${
              detectionMode === 'both'
                ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Both</span>
          </button>
        </div>

        {/* Right: Camera Flip & Settings */}
        <div className="flex items-center gap-2">
          {/* Front / Rear Toggle */}
          <button
            onClick={() => {
              showControls();
              onToggleFacingMode();
            }}
            title={`Switch Camera (${facingMode === 'user' ? 'Front' : 'Rear'})`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white hover:text-cyan-400 text-xs font-medium shadow-lg transition-all cursor-pointer active:scale-95"
          >
            <SwitchCamera className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">
              {facingMode === 'user' ? 'Rear' : 'Front'}
            </span>
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              showControls();
              onOpenSettings();
            }}
            title="Open Detection Settings & Parameters"
            className="p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white hover:text-cyan-400 shadow-lg transition-all cursor-pointer active:scale-95"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Subtle touch-to-reveal indicator when hidden */}
      {!isVisible && (
        <div className="self-center pointer-events-auto">
          <button
            onClick={showControls}
            title="Tap to reveal controls"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 hover:bg-black/60 backdrop-blur-xs border border-white/10 text-white/50 hover:text-white text-[11px] font-mono transition-all cursor-pointer animate-fade-in"
          >
            <Eye className="w-3 h-3 text-cyan-400/70" />
            <span>Tap screen for controls</span>
          </button>
        </div>
      )}

      {/* Bottom controls: Target summary, Pose Variant Switcher & Shutter */}
      <div
        className={`flex items-center justify-between w-full transition-all duration-300 ${
          isVisible
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {/* Active Target Count Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/90 text-xs font-mono shadow-md">
          {detectionMode !== 'pose' && (
            <span>
              <span className="text-emerald-400 font-bold tabular-nums">{activeCount}</span> boxes
            </span>
          )}
          {detectionMode === 'both' && <span className="text-white/30">·</span>}
          {detectionMode !== 'objects' && (
            <span>
              <span className="text-cyan-400 font-bold tabular-nums">{activePoseCount}</span> poses
            </span>
          )}
        </div>

        {/* Quick Pose Variant Pill (when pose is active) */}
        {detectionMode !== 'objects' && (
          <div>
            <button
              onClick={() => {
                showControls();
                onCyclePoseVariant();
              }}
              title="Click to cycle pose variant (Body, Hands, Face, Holistic)"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-200 text-xs font-mono shadow-lg transition-all cursor-pointer active:scale-95"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>Variant: <strong className="uppercase text-white">{activePoseVariant}</strong></span>
            </button>
          </div>
        )}

        {/* Camera Snapshot Shutter Button */}
        <div>
          <button
            onClick={() => {
              showControls();
              onTakeSnapshot();
            }}
            title="Take Freeze Frame Snapshot"
            className="w-12 h-12 rounded-full bg-cyan-600 hover:bg-cyan-500 active:scale-90 text-white flex items-center justify-center shadow-xl border-2 border-white/30 transition-all cursor-pointer"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
