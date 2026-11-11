import React from 'react';
import { Activity, User, Hand, Smile, Sparkles, Sliders } from 'lucide-react';
import { PoseSettings, PoseVariant, PoseStyle, DetectionMode } from '../types/pose';

interface PoseSettingsTabProps {
  detectionMode: DetectionMode;
  onChangeDetectionMode: (mode: DetectionMode) => void;
  settings: PoseSettings;
  onUpdateSettings: (patch: Partial<PoseSettings>) => void;
  poseModelId?: string;
  onSelectPoseModel?: (id: string) => void;
}

export const PoseSettingsTab: React.FC<PoseSettingsTabProps> = ({
  detectionMode,
  onChangeDetectionMode,
  settings,
  onUpdateSettings,
  poseModelId = 'mediapipe',
  onSelectPoseModel,
}) => {
  const variants: { id: PoseVariant; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'body',
      label: 'Body Pose',
      desc: '33-keypoint full body skeletal tracking (shoulders, hips, limbs)',
      icon: <User className="w-4 h-4 text-cyan-400" />,
    },
    {
      id: 'hands',
      label: 'Hand Tracking',
      desc: '21-keypoint per hand articulation (fingers, thumb, wrist)',
      icon: <Hand className="w-4 h-4 text-sky-400" />,
    },
    {
      id: 'face',
      label: 'Face Mesh / Contours',
      desc: '38 facial landmark contours (eyes, lips, brows, face oval)',
      icon: <Smile className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'holistic',
      label: 'Holistic (All in One)',
      desc: 'Simultaneous body pose, hands, and facial mesh tracking',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
    },
  ];

  const styles: { id: PoseStyle; label: string }[] = [
    { id: 'neon', label: 'Neon Cyan' },
    { id: 'rainbow', label: 'Rainbow Limbs' },
    { id: 'emerald', label: 'Emerald Glow' },
    { id: 'minimal', label: 'Minimal White' },
  ];

  return (
    <div className="flex flex-col gap-5 text-slate-100">
    <div className="flex flex-col gap-2 p-4 rounded-xl border border-slate-800 bg-slate-950/60">
      <span className="text-sm font-semibold text-white">Pose Model</span>
      <p className="text-xs text-slate-400">MediaPipe runs in your browser (body / face / hands / holistic). YOLO Pose and RF-DETR Pose run on the server GPU (full body, COCO-17).</p>
      <select
        value={poseModelId}
        onChange={(e) => onSelectPoseModel?.(e.target.value)}
        className="mt-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
      >
        <optgroup label="Browser">
          <option value="mediapipe">MediaPipe Pose (browser)</option>
        </optgroup>
        <optgroup label="Server GPU">
          <option value="yolo26n-pose">YOLO26n Pose</option>
          <option value="yolo26s-pose">YOLO26s Pose</option>
          <option value="yolo26m-pose">YOLO26m Pose</option>
          <option value="yolo26l-pose">YOLO26l Pose</option>
          <option value="yolo26x-pose">YOLO26x Pose</option>
          <option value="rf-detr-pose">RF-DETR Pose (Keypoint XLarge)</option>
        </optgroup>
      </select>
    </div>
      {/* Primary Detection Mode Selector */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Active Visual Stream Layers
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: 'objects', label: 'Object Boxes Only' },
              { id: 'pose', label: 'Pose Estimation Only' },
              { id: 'both', label: 'Both (Boxes + Pose)' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => onChangeDetectionMode(m.id)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-all cursor-pointer ${
                detectionMode === m.id
                  ? 'border-cyan-500 bg-cyan-950/50 text-cyan-300 font-semibold shadow-sm'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pose Variant Selection */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Pose Tracking Variants
          </h3>
          <span className="text-[11px] font-mono text-cyan-400">
            Active: {settings.activeVariant.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {variants.map((v) => {
            const isSelected = settings.activeVariant === v.id;
            return (
              <button
                key={v.id}
                onClick={() => onUpdateSettings({ activeVariant: v.id })}
                className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-950/40 text-white shadow-sm ring-1 ring-cyan-500/30'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="p-2 rounded-md bg-slate-800 border border-slate-700 mt-0.5">
                  {v.icon}
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">{v.label}</div>
                  <div className="text-[11px] text-slate-400 leading-snug">{v.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Style & Sliders */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 flex flex-col gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-300 block mb-2">
            Skeleton Color Style
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {styles.map((s) => (
              <button
                key={s.id}
                onClick={() => onUpdateSettings({ style: s.id })}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                  settings.style === s.id
                    ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 font-semibold'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-800 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.showSkeleton}
              onChange={(e) => onUpdateSettings({ showSkeleton: e.target.checked })}
              className="rounded border-slate-700 text-cyan-600 focus:ring-cyan-500"
            />
            <span>Show Bone Connections</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.showKeypoints}
              onChange={(e) => onUpdateSettings({ showKeypoints: e.target.checked })}
              className="rounded border-slate-700 text-cyan-600 focus:ring-cyan-500"
            />
            <span>Show Joint Circles</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.showLabels}
              onChange={(e) => onUpdateSettings({ showLabels: e.target.checked })}
              className="rounded border-slate-700 text-cyan-600 focus:ring-cyan-500"
            />
            <span>Show Part Labels</span>
          </label>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-400">Min Keypoint Confidence</span>
              <span className="font-mono text-cyan-400 font-semibold">
                {(settings.minConfidence * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={settings.minConfidence}
              onChange={(e) => onUpdateSettings({ minConfidence: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-400">Bone Line Width</span>
              <span className="font-mono text-cyan-400 font-semibold">{settings.lineWidth}px</span>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              step="1"
              value={settings.lineWidth}
              onChange={(e) => onUpdateSettings({ lineWidth: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
