import React, { useState, useEffect } from 'react';
import { X, Sliders } from 'lucide-react';
import { BoxStyle, ModelOption, TelemetryStats, DetectionSnapshot } from '../types/detection';
import { DetectionMode, PoseSettings } from '../types/pose';
import { ControlPanel } from './ControlPanel';
import { PoseSettingsTab } from './PoseSettingsTab';
import { ModelSelector } from './ModelSelector';
import { SnapshotLibrary } from './SnapshotLibrary';
import { CameraSettingsTab } from './CameraSettingsTab';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'params' | 'pose' | 'camera' | 'models' | 'snapshots';
  videoSource?: import('../types/source').VideoSource;
  sourceBusy?: boolean;
  sourceError?: string | null;
  onLoadSourceUrl?: (url: string) => void;
  onSelectSourceFile?: (file: File) => void;
  onUseCamera?: () => void;
  poseModelId?: string;
  onSelectPoseModel?: (id: string) => void;
  facingMode: 'user' | 'environment';
  onChangeFacingMode: (mode: 'user' | 'environment') => void;
  models: ModelOption[];
  selectedModelId: string;
  onSelectModel: (id: string) => void;
  onDownloadModel: (id: string) => void;
  loadingModelId?: string | null;
  minConfidence: number;
  onChangeMinConfidence: (val: number) => void;
  maxDetections: number;
  onChangeMaxDetections: (val: number) => void;
  selectedClasses: string[];
  onToggleClass: (cls: string) => void;
  onClearClassFilters: () => void;
  boxStyle: BoxStyle;
  onChangeBoxStyle: (style: BoxStyle) => void;
  showConfidence: boolean;
  onToggleShowConfidence: () => void;
  showCenterDot: boolean;
  onToggleShowCenterDot: () => void;
  showTrackId: boolean;
  onToggleShowTrackId: () => void;
  audioAlert: boolean;
  onToggleAudioAlert: () => void;
  detectionMode: DetectionMode;
  onChangeDetectionMode: (mode: DetectionMode) => void;
  poseSettings: PoseSettings;
  onUpdatePoseSettings: (patch: Partial<PoseSettings>) => void;
  telemetry: TelemetryStats;
  snapshots: DetectionSnapshot[];
  onSelectSnapshot: (snap: DetectionSnapshot) => void;
  onClearSnapshots: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'params',
  videoSource,
  sourceBusy = false,
  sourceError = null,
  onLoadSourceUrl,
  onSelectSourceFile,
  onUseCamera,
  poseModelId = 'mediapipe',
  onSelectPoseModel,
  facingMode,
  onChangeFacingMode,
  models,
  selectedModelId,
  onSelectModel,
  onDownloadModel,
  loadingModelId = null,
  minConfidence,
  onChangeMinConfidence,
  maxDetections,
  onChangeMaxDetections,
  selectedClasses,
  onToggleClass,
  onClearClassFilters,
  boxStyle,
  onChangeBoxStyle,
  showConfidence,
  onToggleShowConfidence,
  showCenterDot,
  onToggleShowCenterDot,
  showTrackId,
  onToggleShowTrackId,
  audioAlert,
  onToggleAudioAlert,
  detectionMode,
  onChangeDetectionMode,
  poseSettings,
  onUpdatePoseSettings,
  telemetry,
  snapshots,
  onSelectSnapshot,
  onClearSnapshots,
}) => {
  const [activeTab, setActiveTab] = useState<'params' | 'pose' | 'camera' | 'models' | 'snapshots'>('params');

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Detection & Camera Settings</h2>
              <p className="text-xs text-slate-400">
                Configure object boxes, pose variants, camera stream, and models
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 text-xs font-medium overflow-x-auto hud-scroll">
          {[
            { id: 'params', label: 'Object Boxes' },
            { id: 'pose', label: 'Pose & Variants' },
            { id: 'camera', label: 'Video Source & Camera' },
            { id: 'models', label: `Engines (${models.length})` },
            { id: 'snapshots', label: `Snapshots (${snapshots.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`pb-2.5 px-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === t.id
                  ? 'border-cyan-500 text-cyan-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="hud-scroll p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {activeTab === 'params' && (
            <ControlPanel
              minConfidence={minConfidence}
              onChangeMinConfidence={onChangeMinConfidence}
              maxDetections={maxDetections}
              onChangeMaxDetections={onChangeMaxDetections}
              selectedClasses={selectedClasses}
              onToggleClass={onToggleClass}
              onClearClassFilters={onClearClassFilters}
              boxStyle={boxStyle}
              onChangeBoxStyle={onChangeBoxStyle}
              showConfidence={showConfidence}
              onToggleShowConfidence={onToggleShowConfidence}
              showCenterDot={showCenterDot}
              onToggleShowCenterDot={onToggleShowCenterDot}
              showTrackId={showTrackId}
              onToggleShowTrackId={onToggleShowTrackId}
              audioAlert={audioAlert}
              onToggleAudioAlert={onToggleAudioAlert}
            />
          )}

          {activeTab === 'pose' && (
            <PoseSettingsTab
              detectionMode={detectionMode}
              onChangeDetectionMode={onChangeDetectionMode}
              settings={poseSettings}
              onUpdateSettings={onUpdatePoseSettings}
              poseModelId={poseModelId}
              onSelectPoseModel={onSelectPoseModel ?? (() => {})}
            />
          )}

          {activeTab === 'camera' && (
            <CameraSettingsTab
              facingMode={facingMode}
              onChangeFacingMode={onChangeFacingMode}
              fps={telemetry.fps}
              resolution={telemetry.currentResolution}
              videoSource={videoSource ?? { kind: 'camera' }}
              sourceBusy={sourceBusy}
              sourceError={sourceError}
              onLoadSourceUrl={onLoadSourceUrl ?? (() => {})}
              onSelectSourceFile={onSelectSourceFile ?? (() => {})}
              onUseCamera={onUseCamera ?? (() => {})}
            />
          )}

          {activeTab === 'models' && (
            <ModelSelector
              models={models}
              selectedModelId={selectedModelId}
              onSelectModel={onSelectModel}
              onDownloadModel={onDownloadModel}
              loadingModelId={loadingModelId}
            />
          )}

          {activeTab === 'snapshots' && (
            <SnapshotLibrary
              snapshots={snapshots}
              onSelectSnapshot={onSelectSnapshot}
              onClearSnapshots={onClearSnapshots}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/60 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <span>FPS: {telemetry.fps}</span>
            <span>·</span>
            <span>Latency: {telemetry.inferenceTimeMs}ms</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
