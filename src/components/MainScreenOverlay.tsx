import React, { useEffect, useRef, useState } from 'react';
import { SwitchCamera, Settings, Camera, Box, User, Sparkles, Eye, ChevronDown, Loader2, Check, Server, MonitorSmartphone, PersonStanding, ScanFace, Hand, Link2 } from 'lucide-react';
import { DetectionMode, PoseVariant } from '../types/pose';
import { ModelOption } from '../types/detection';
import { POSE_MODELS, isServerPoseModel } from '../services/serverPose';
import { useAutoAutoHide } from '../hooks/useAutoAutoHide';

interface MainScreenOverlayProps {
  facingMode: 'user' | 'environment';
  onToggleFacingMode: () => void;
  modelName: string;
  models: ModelOption[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  loadingModelId?: string | null;
  activeCount: number;
  activePoseCount?: number;
  detectionMode: DetectionMode;
  onChangeDetectionMode: (mode: DetectionMode) => void;
  activePoseVariant: PoseVariant;
  onSelectPoseVariant: (variant: PoseVariant) => void;
  poseModelId: string;
  onSelectPoseModel: (id: string) => void;
  onOpenVideoSource: () => void;
  onOpenSettings: () => void;
  onTakeSnapshot: () => void;
  isSettingsOpen?: boolean;
}

export const MainScreenOverlay: React.FC<MainScreenOverlayProps> = ({
  facingMode,
  onToggleFacingMode,
  modelName,
  models,
  selectedModelId,
  onSelectModel,
  loadingModelId = null,
  activeCount,
  activePoseCount = 0,
  detectionMode,
  onChangeDetectionMode,
  activePoseVariant,
  onSelectPoseVariant,
  poseModelId,
  onSelectPoseModel,
  onOpenVideoSource,
  onOpenSettings,
  onTakeSnapshot,
  isSettingsOpen = false,
}) => {
  const [openMenu, setOpenMenu] = useState<'detection' | 'pose' | null>(null);
  const isModelMenuOpen = openMenu !== null;
  const modelMenuRef = useRef<HTMLDivElement>(null);

  // Auto-hide buttons after 3 seconds of user inactivity (paused while a menu/modal is open)
  const { isVisible, showControls } = useAutoAutoHide(3000, isSettingsOpen || isModelMenuOpen);

  // Close the HUD model menu on outside click or Escape
  useEffect(() => {
    if (!isModelMenuOpen) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isModelMenuOpen]);

  const modelGroups = [
    { key: 'server', label: 'Server GPU', hint: 'Runs on this server', icon: Server, items: models.filter((m) => m.backend === 'Server GPU') },
    { key: 'browser', label: 'Browser', hint: 'Runs on your device', icon: MonitorSmartphone, items: models.filter((m) => m.backend !== 'Server GPU') },
  ];

  const POSE_OPTIONS: Array<{ id: PoseVariant; label: string; menuLabel: string; meta: string; icon: typeof User }> = [
    { id: 'body', label: 'Full', menuLabel: 'Full Body', meta: 'MediaPipe PoseLandmarker · 33 pts', icon: PersonStanding },
    { id: 'face', label: 'Face', menuLabel: 'Face', meta: 'Face contours · 38 pts', icon: ScanFace },
    { id: 'hands', label: 'Hand', menuLabel: 'Hand', meta: 'MediaPipe HandLandmarker · 21 pts/hand', icon: Hand },
    { id: 'holistic', label: 'All', menuLabel: 'All (Holistic)', meta: 'Body + Face + Hands combined', icon: Sparkles },
  ];
  const activePoseOption = POSE_OPTIONS.find((o) => o.id === activePoseVariant) ?? POSE_OPTIONS[0];

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
        {/* Left: HUD Model Dropdown & Camera Mode */}
        <div ref={modelMenuRef} className="flex flex-col items-start gap-2">
          <div className="relative">
          <button
            onClick={() => {
              showControls();
              if (!loadingModelId) setOpenMenu((m) => (m === 'detection' ? null : 'detection'));
            }}
            disabled={!!loadingModelId}
            title={`Detection model: ${modelName} — click to switch`}
            aria-label="Select detection model"
            aria-expanded={openMenu === 'detection'}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 hover:border-cyan-500/40 text-white shadow-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait active:scale-95"
          >
            {loadingModelId ? (
              <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
            ) : (
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            )}
            <span className="text-xs font-mono font-medium max-w-[46vw] sm:max-w-xs truncate">
              {modelName}
            </span>
            <span className="text-white/40">·</span>
            <span className="text-[11px] font-mono text-cyan-300 uppercase">
              {facingMode === 'user' ? 'Front' : 'Rear'}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-cyan-400 shrink-0 transition-transform duration-200 ${openMenu === 'detection' ? 'rotate-180' : ''}`}
            />
          </button>

          {/* HUD-style dropdown menu */}
          {openMenu === 'detection' && (
            <div className="absolute left-0 top-full mt-2 w-72 max-w-[86vw] rounded-2xl bg-black/75 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden z-50">
              <div className="hud-scroll max-h-[62vh] overflow-y-auto p-1.5 pr-1 flex flex-col gap-1">
                {modelGroups.map((group) => (
                  <div key={group.key}>
                    <div className="flex items-center gap-1.5 px-2.5 pt-2 pb-1">
                      <group.icon className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-[10px] font-mono font-semibold uppercase text-slate-300">
                        {group.label}
                      </span>
                      <span className="text-[10px] text-slate-500">· {group.hint}</span>
                      <span className="ml-auto text-[10px] font-mono px-1.5 py-px rounded-full bg-white/10 text-slate-300">
                        {group.items.length}
                      </span>
                    </div>
                    {group.items.map((m) => {
                      const isActive = m.id === selectedModelId;
                      const isReady = m.downloadStatus === 'ready';
                      return (
                        <button
                          key={m.id}
                          onClick={() => {
                            setOpenMenu(null);
                            showControls();
                            onSelectModel(m.id);
                          }}
                          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer active:scale-[0.98] ${
                            isActive
                              ? 'bg-cyan-600/25 border border-cyan-500/50 text-white'
                              : 'border border-transparent text-slate-200 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full shrink-0 ${
                              isActive ? 'bg-cyan-400' : isReady ? 'bg-emerald-400' : 'bg-white/25'
                            }`}
                          />
                          <span className="flex-1 min-w-0">
                            <span className="block text-xs font-medium truncate">{m.name}</span>
                            <span className="block text-[10px] font-mono text-slate-400 tabular-nums">
                              {m.sizeMb}MB · ~{m.expectedLatencyMs}ms · {isReady ? 'Ready' : 'Loads on select'}
                            </span>
                          </span>
                          {isActive && <Check className="w-3.5 h-3.5 text-cyan-300 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="px-3 py-2 border-t border-white/10 bg-white/5">
                <p className="text-[10px] font-mono text-slate-400">
                  Active: <span className="text-cyan-300">{modelName}</span>
                </p>
              </div>
            </div>
          )}
          </div>

          {/* Pose Model Dropdown (separate from detection) */}
          <div className="relative">
            <button
              onClick={() => { showControls(); setOpenMenu((m) => (m === 'pose' ? null : 'pose')); }}
              title={`Pose detection: ${activePoseOption.menuLabel} — click to switch`}
              aria-label="Select pose detection type"
              aria-expanded={openMenu === 'pose'}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 hover:border-cyan-500/40 text-white shadow-lg transition-all cursor-pointer active:scale-95"
            >
              <activePoseOption.icon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-xs font-mono font-medium truncate">
                Pose: {isServerPoseModel(poseModelId)
                  ? (POSE_MODELS.find((m) => m.id === poseModelId)?.name ?? poseModelId)
                  : activePoseOption.menuLabel}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-cyan-400 shrink-0 transition-transform duration-200 ${openMenu === 'pose' ? 'rotate-180' : ''}`} />
            </button>

            {openMenu === 'pose' && (
              <div className="absolute left-0 top-full mt-2 w-72 max-w-[86vw] rounded-2xl bg-black/75 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden z-50">
                <div className="hud-scroll max-h-[62vh] overflow-y-auto p-1.5 pr-1">
                  <div className="flex items-center gap-1.5 px-2.5 pt-2 pb-1">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[10px] font-mono font-semibold uppercase text-slate-300">Pose Model</span>
                    <span className="text-[10px] text-slate-500">· Browser or Server GPU</span>
                  </div>
                  {POSE_MODELS.map((pm) => {
                    const isActive = pm.id === poseModelId;
                    return (
                      <button
                        key={pm.id}
                        onClick={() => { setOpenMenu(null); showControls(); onSelectPoseModel(pm.id); }}
                        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer active:scale-[0.98] ${isActive ? 'bg-cyan-600/25 border border-cyan-500/50 text-white' : 'border border-transparent text-slate-200 hover:bg-white/10 hover:text-white'}`}
                      >
                        <span className={`size-1.5 rounded-full shrink-0 ${isActive ? 'bg-cyan-400' : pm.group === 'server' ? 'bg-violet-400' : 'bg-emerald-400'}`} />
                        <span className="flex-1 min-w-0">
                          <span className="block text-xs font-medium truncate">{pm.name}</span>
                          <span className="block text-[10px] font-mono text-slate-400 truncate">{pm.meta}</span>
                        </span>
                        {isActive && <Check className="w-3.5 h-3.5 text-cyan-300 shrink-0" />}
                      </button>
                    );
                  })}
                  <div className="flex items-center gap-1.5 px-2.5 pt-2.5 pb-1">
                    <PersonStanding className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[10px] font-mono font-semibold uppercase text-slate-300">Pose Type</span>
                    <span className="text-[10px] text-slate-500">{isServerPoseModel(poseModelId) ? '· Full body only (server)' : '· MediaPipe'}</span>
                  </div>
                  {POSE_OPTIONS.map((o) => {
                    const isActive = o.id === activePoseVariant;
                    return (
                      <button
                        key={o.id}
                        onClick={() => { setOpenMenu(null); showControls(); onSelectPoseVariant(o.id); }}
                        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer active:scale-[0.98] ${isActive ? 'bg-cyan-600/25 border border-cyan-500/50 text-white' : 'border border-transparent text-slate-200 hover:bg-white/10 hover:text-white'}`}
                      >
                        <o.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
                        <span className="flex-1 min-w-0">
                          <span className="block text-xs font-medium truncate">{o.menuLabel}</span>
                          <span className="block text-[10px] font-mono text-slate-400 truncate">{o.meta}</span>
                        </span>
                        {isActive && <Check className="w-3.5 h-3.5 text-cyan-300 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                <div className="px-3 py-2 border-t border-white/10 bg-white/5">
                  <p className="text-[10px] font-mono text-slate-400">
                    Active pose: <span className="text-cyan-300">{activePoseOption.menuLabel}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
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

          {/* Video Source (YouTube / Drive / RTSP / File) */}
          <button
            onClick={() => {
              showControls();
              onOpenVideoSource();
            }}
            title="Video source: Camera / YouTube / Google Drive / RTSP / File"
            aria-label="Open video source settings"
            className="p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white hover:text-cyan-400 shadow-lg transition-all cursor-pointer active:scale-95"
          >
            <Link2 className="w-4 h-4" />
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

        {/* Pose Type Toggle: Full / Face / Hand / All (when pose is active) */}
        {detectionMode !== 'objects' && (
          <div className="flex items-center p-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-xs shadow-lg" role="group" aria-label="Pose detection type">
            {POSE_OPTIONS.map((o) => (
              <button
                key={o.id}
                onClick={() => { showControls(); onSelectPoseVariant(o.id); }}
                title={`Pose detection: ${o.menuLabel}`}
                aria-pressed={activePoseVariant === o.id}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer ${activePoseVariant === o.id ? 'bg-cyan-600 text-white font-semibold shadow-sm' : 'text-slate-300 hover:text-white'}`}
              >
                <o.icon className="w-3.5 h-3.5" />
                <span>{o.label}</span>
              </button>
            ))}
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
