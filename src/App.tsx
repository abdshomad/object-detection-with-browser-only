import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BoxStyle,
  TelemetryStats,
  DetectedObject,
  DetectionSnapshot,
  ModelOption,
} from './types/detection';
import { getStoredDetectorModels } from './services/detectorRegistry';
import { CameraStream } from './components/CameraStream';
import { MainScreenOverlay } from './components/MainScreenOverlay';
import { SettingsModal } from './components/SettingsModal';
import { SnapshotModal } from './components/SnapshotModal';
import { downloadAndInitModel } from './services/modelEngine';
import { persistSnapshot, getStoredSnapshots } from './services/apiClient';
import { usePoseState } from './hooks/usePoseState';
import { VideoSource } from './types/source';
import { resolveVideoUrl, stopRtspSource, uploadVideoFile, uploadCustomModel, fetchCustomModels, deleteCustomModel } from './services/videoSource';
import { warmupServerPose, isServerPoseModel } from './services/serverPose';

export default function App() {
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [videoSource, setVideoSource] = useState<VideoSource>({ kind: 'camera' });
  const [sourceBusy, setSourceBusy] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [poseModelId, setPoseModelId] = useState<string>('mediapipe');
  const [settingsTab, setSettingsTab] = useState<'params' | 'pose' | 'camera' | 'models' | 'snapshots'>('params');
  const [models, setModels] = useState<ModelOption[]>(getStoredDetectorModels);

  const [selectedModelId, setSelectedModelId] = useState<string>('tfjs-coco-ssd');
  const [loadingModelId, setLoadingModelId] = useState<string | null>(null);

  // Object Box Parameters
  const [minConfidence, setMinConfidence] = useState<number>(0.5);
  const [maxDetections, setMaxDetections] = useState<number>(10);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [boxStyle, setBoxStyle] = useState<BoxStyle>('neon');
  const [showConfidence, setShowConfidence] = useState<boolean>(true);
  const [showCenterDot, setShowCenterDot] = useState<boolean>(true);
  const [showTrackId, setShowTrackId] = useState<boolean>(false);
  const [audioAlert, setAudioAlert] = useState<boolean>(false);

  // Pose & Variant State Hook
  const {
    detectionMode,
    setDetectionMode,
    poseSettings,
    handleUpdatePoseSettings,
    handleSelectPoseVariant: handleSelectPoseVariantHook,
    handleCyclePoseVariant,
    currentPoses,
    setCurrentPoses,
  } = usePoseState();

  // Modals & Detection State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [currentObjects, setCurrentObjects] = useState<DetectedObject[]>([]);
  const [snapshots, setSnapshots] = useState<DetectionSnapshot[]>(getStoredSnapshots);
  const [activeSnapshot, setActiveSnapshot] = useState<DetectionSnapshot | null>(null);

  const [telemetry, setTelemetry] = useState<TelemetryStats>({
    fps: 30,
    inferenceTimeMs: 24,
    totalObjectsDetected: 0,
    activeObjectCount: 0,
    activePoseCount: 0,
    currentResolution: { width: 1280, height: 720 },
    engineStatus: 'idle',
  });

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const handleToggleFacingMode = useCallback(() => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  const handleDownloadModel = useCallback(async (modelId: string) => {
    setLoadingModelId(modelId);
    setModels((prev) =>
      prev.map((m) =>
        m.id === modelId ? { ...m, downloadStatus: 'downloading', downloadProgress: 15 } : m
      )
    );

    try {
      await downloadAndInitModel(modelId, (pct) => {
        setModels((prev) =>
          prev.map((m) => (m.id === modelId ? { ...m, downloadProgress: pct } : m))
        );
      });

      setModels((prev) => {
        const updated = prev.map((m) =>
          m.id === modelId
            ? { ...m, downloadStatus: 'ready' as const, downloadProgress: 100 }
            : m
        );
        const readyIds = updated.filter((m) => m.downloadStatus === 'ready').map((m) => m.id);
        localStorage.setItem('vision_downloaded_models', JSON.stringify(readyIds));
        return updated;
      });

      setSelectedModelId(modelId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download failed';
      setModels((prev) =>
        prev.map((m) =>
          m.id === modelId ? { ...m, downloadStatus: 'error' as const, errorMessage: msg } : m
        )
      );
    } finally {
      setLoadingModelId(null);
    }
  }, []);

  const handleSelectModel = useCallback(
    async (modelId: string) => {
      const target = models.find((m) => m.id === modelId);
      if (target?.downloadStatus !== 'ready') {
        await handleDownloadModel(modelId);
      } else {
        setSelectedModelId(modelId);
      }
    },
    [models, handleDownloadModel]
  );

  const handleSelectPoseVariant = useCallback(
    (variant: typeof poseSettings.activeVariant) => {
      handleSelectPoseVariantHook(variant);
      setPoseModelId('mediapipe');
      if (detectionMode === 'objects') setDetectionMode('both');
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [detectionMode]
  );

  const handleLoadSourceUrl = useCallback(async (url: string) => {
    setSourceBusy(true);
    setSourceError(null);
    try {
      if (videoSource.kind === 'url') await stopRtspSource(videoSource.streamUrl);
      const resolved = await resolveVideoUrl(url);
      setVideoSource(resolved);
    } catch (err: unknown) {
      setSourceError(err instanceof Error ? err.message : 'Failed to load video source');
    } finally {
      setSourceBusy(false);
    }
  }, [videoSource]);

  const handleSelectSourceFile = useCallback(async (file: File) => {
    setSourceBusy(true);
    setSourceError(null);
    try {
      const uploaded = await uploadVideoFile(file);
      setVideoSource(uploaded);
    } catch (err: unknown) {
      setSourceError(err instanceof Error ? err.message : 'Video upload failed');
    } finally {
      setSourceBusy(false);
    }
  }, []);

  const handleUseCamera = useCallback(async () => {
    if (videoSource.kind === 'url') await stopRtspSource(videoSource.streamUrl);
    setSourceError(null);
    setVideoSource({ kind: 'camera' });
  }, [videoSource]);

  // Custom uploaded YOLO models (server GPU) merged into the selector list.
  useEffect(() => {
    fetchCustomModels()
      .then((customs) => {
        if (!customs.length) return;
        setModels((prev) => {
          const known = new Set(prev.map((m) => m.id));
          const extra: ModelOption[] = customs
            .filter((c) => !known.has(c.id))
            .map((c) => ({
              id: c.id,
              name: `${c.name} (Custom)`,
              family: 'Ultralytics' as const,
              tagline: 'Your uploaded YOLO model — runs on server NVIDIA GPU',
              sizeMb: 0,
              expectedLatencyMs: 20,
              inputResolution: '640x640 px',
              confidenceAccuracy: `${c.classes?.length ?? 80} classes`,
              architecture: 'Custom YOLO checkpoint (.pt, server CUDA)',
              cocoClassesCount: c.classes?.length ?? 80,
              backend: 'Server GPU' as const,
              downloadStatus: 'not_downloaded' as const,
              downloadProgress: 0,
            }));
          return [...prev, ...extra];
        });
      })
      .catch(() => {});
  }, []);

  const handleUploadModel = useCallback(async (file: File, name: string) => {
    const uploaded = await uploadCustomModel(file, name);
    const option: ModelOption = {
      id: uploaded.id,
      name: `${uploaded.name} (Custom)`,
      family: 'Ultralytics',
      tagline: 'Your uploaded YOLO model — runs on server NVIDIA GPU',
      sizeMb: Math.round((uploaded.sizeBytes / 1e6) * 10) / 10,
      expectedLatencyMs: 20,
      inputResolution: '640x640 px',
      confidenceAccuracy: `${uploaded.classes.length} classes`,
      architecture: 'Custom YOLO checkpoint (.pt, server CUDA)',
      cocoClassesCount: uploaded.classes.length,
      backend: 'Server GPU',
      downloadStatus: 'not_downloaded',
      downloadProgress: 0,
    };
    setModels((prev) => [...prev.filter((m) => m.id !== uploaded.id), option]);
    return uploaded.id;
  }, []);

  const handleDeleteModel = useCallback(async (id: string) => {
    await deleteCustomModel(id);
    setModels((prev) => prev.filter((m) => m.id !== id));
    setSelectedModelId((cur) => (cur === id ? 'tfjs-coco-ssd' : cur));
  }, []);

  const handleSelectPoseModel = useCallback(async (id: string) => {
    setPoseModelId(id);
    if (isServerPoseModel(id)) {
      warmupServerPose(id).catch((err) => console.warn('Pose warmup failed:', err));
      if (detectionMode === 'objects') setDetectionMode('both');
    }
  }, [detectionMode, setDetectionMode]);

  const handleToggleClass = (className: string) => {
    setSelectedClasses((prev) =>
      prev.includes(className) ? prev.filter((c) => c !== className) : [...prev, className]
    );
  };

  const handleTakeSnapshot = useCallback(async () => {
    const video = document.querySelector('video') as HTMLVideoElement | null;
    let dataUrl = '';

    if (video && video.videoWidth) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        dataUrl = tempCanvas.toDataURL('image/jpeg', 0.9);
      }
    }

    if (dataUrl) {
      const activeModel = models.find((m) => m.id === selectedModelId);
      const newSnapshot: DetectionSnapshot = {
        id: `snap_${Date.now()}`,
        timestamp: Date.now(),
        dataUrl,
        modelUsed: activeModel?.name || selectedModelId,
        objects: currentObjects,
        poses: currentPoses,
        inferenceTimeMs: telemetry.inferenceTimeMs,
      };
      setSnapshots((prev) => [newSnapshot, ...prev]);
      setActiveSnapshot(newSnapshot);
      await persistSnapshot(newSnapshot);
    }
  }, [models, selectedModelId, currentObjects, currentPoses, telemetry.inferenceTimeMs]);

  const activeModel = useMemo(
    () => models.find((m) => m.id === selectedModelId) || models[0],
    [models, selectedModelId]
  );

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black overflow-hidden select-none">
      {/* Full-Screen Camera View and Real-Time Detections (Boxes + Poses) */}
      <CameraStream
        facingMode={facingMode}
        modelId={selectedModelId}
        minConfidence={minConfidence}
        maxDetections={maxDetections}
        selectedClasses={selectedClasses}
        boxStyle={boxStyle}
        showConfidence={showConfidence}
        showCenterDot={showCenterDot}
        showTrackId={showTrackId}
        detectionMode={detectionMode}
        poseSettings={poseSettings}
        videoSource={videoSource}
        poseModelId={poseModelId}
        onUpdateTelemetry={(delta) => setTelemetry((prev) => ({ ...prev, ...delta }))}
        onNewDetections={setCurrentObjects}
        onNewPoses={setCurrentPoses}
      />

      {/* Clean Full-Screen Overlay with Mode Selector & Minimal Affordances */}
      <MainScreenOverlay
        facingMode={facingMode}
        onToggleFacingMode={handleToggleFacingMode}
        modelName={activeModel.name}
        models={models}
        selectedModelId={selectedModelId}
        onSelectModel={handleSelectModel}
        loadingModelId={loadingModelId}
        activeCount={currentObjects.length}
        activePoseCount={currentPoses.length}
        detectionMode={detectionMode}
        onChangeDetectionMode={setDetectionMode}
        activePoseVariant={poseSettings.activeVariant}
        onSelectPoseVariant={handleSelectPoseVariant}
        poseModelId={poseModelId}
        onSelectPoseModel={handleSelectPoseModel}
        onOpenVideoSource={() => { setSettingsTab('camera'); setIsSettingsOpen(true); }}
        onOpenSettings={() => { setSettingsTab('params'); setIsSettingsOpen(true); }}
        onTakeSnapshot={handleTakeSnapshot}
        isSettingsOpen={isSettingsOpen}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        initialTab={settingsTab}
        videoSource={videoSource}
        sourceBusy={sourceBusy}
        sourceError={sourceError}
        onLoadSourceUrl={handleLoadSourceUrl}
        onSelectSourceFile={handleSelectSourceFile}
        onUseCamera={handleUseCamera}
        poseModelId={poseModelId}
        onSelectPoseModel={handleSelectPoseModel}
        onUploadModel={handleUploadModel}
        onDeleteModel={handleDeleteModel}
        onClose={() => setIsSettingsOpen(false)}
        facingMode={facingMode}
        onChangeFacingMode={setFacingMode}
        models={models}
        selectedModelId={selectedModelId}
        onSelectModel={handleSelectModel}
        onDownloadModel={handleDownloadModel}
        loadingModelId={loadingModelId}
        minConfidence={minConfidence}
        onChangeMinConfidence={setMinConfidence}
        maxDetections={maxDetections}
        onChangeMaxDetections={setMaxDetections}
        selectedClasses={selectedClasses}
        onToggleClass={handleToggleClass}
        onClearClassFilters={() => setSelectedClasses([])}
        boxStyle={boxStyle}
        onChangeBoxStyle={setBoxStyle}
        showConfidence={showConfidence}
        onToggleShowConfidence={() => setShowConfidence(!showConfidence)}
        showCenterDot={showCenterDot}
        onToggleShowCenterDot={() => setShowCenterDot(!showCenterDot)}
        showTrackId={showTrackId}
        onToggleShowTrackId={() => setShowTrackId(!showTrackId)}
        audioAlert={audioAlert}
        onToggleAudioAlert={() => setAudioAlert(!audioAlert)}
        detectionMode={detectionMode}
        onChangeDetectionMode={setDetectionMode}
        poseSettings={poseSettings}
        onUpdatePoseSettings={handleUpdatePoseSettings}
        telemetry={telemetry}
        snapshots={snapshots}
        onSelectSnapshot={setActiveSnapshot}
        onClearSnapshots={() => {
          setSnapshots([]);
          localStorage.removeItem('vision_snapshots');
        }}
      />

      {/* Snapshot Inspection Modal */}
      <SnapshotModal
        snapshot={activeSnapshot}
        onClose={() => setActiveSnapshot(null)}
      />
    </div>
  );
}
