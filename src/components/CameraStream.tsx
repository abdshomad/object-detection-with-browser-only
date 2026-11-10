import React, { useRef, useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import { DetectedObject, BoxStyle, TelemetryStats } from '../types/detection';
import { DetectionMode, PoseSettings, PoseVariantResult } from '../types/pose';
import { BoundingBoxOverlay } from './BoundingBoxOverlay';
import { PoseOverlay } from './PoseOverlay';
import { useCameraStream } from './useCameraStream';
import { runBrowserDetection } from '../services/modelEngine';
import { detectPoseVariants, initPoseModel } from '../services/poseVariantEngine';

interface CameraStreamProps {
  facingMode: 'user' | 'environment';
  modelId: string;
  minConfidence: number;
  maxDetections: number;
  selectedClasses: string[];
  boxStyle: BoxStyle;
  showConfidence: boolean;
  showCenterDot: boolean;
  showTrackId: boolean;
  detectionMode: DetectionMode;
  poseSettings: PoseSettings;
  onUpdateTelemetry: (stats: Partial<TelemetryStats>) => void;
  onNewDetections: (objects: DetectedObject[]) => void;
  onNewPoses?: (poses: PoseVariantResult[]) => void;
}

export const CameraStream: React.FC<CameraStreamProps> = ({
  facingMode,
  modelId,
  minConfidence,
  maxDetections,
  selectedClasses,
  boxStyle,
  showConfidence,
  showCenterDot,
  showTrackId,
  detectionMode,
  poseSettings,
  onUpdateTelemetry,
  onNewDetections,
  onNewPoses,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [detectedPoses, setDetectedPoses] = useState<PoseVariantResult[]>([]);
  const [videoDimensions, setVideoDimensions] = useState({ width: 1280, height: 720 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const animationFrameId = useRef<number | null>(null);
  const lastFpsCalc = useRef<{ time: number; frames: number }>({
    time: performance.now(),
    frames: 0,
  });

  const { cameraError, startCamera } = useCameraStream({
    facingMode,
    videoRef,
  });

  useEffect(() => {
    initPoseModel().catch(() => {});
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    window.addEventListener('resize', updateSize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const detectLoop = async () => {
      const now = performance.now();
      lastFpsCalc.current.frames += 1;

      if (now - lastFpsCalc.current.time >= 500) {
        const deltaSec = (now - lastFpsCalc.current.time) / 1000;
        const currentFps = Math.round(lastFpsCalc.current.frames / deltaSec);
        onUpdateTelemetry({ fps: currentFps });
        lastFpsCalc.current = { time: now, frames: 0 };
      }

      try {
        const video = videoRef.current;
        if (video && video.readyState >= 2) {
          const width = video.videoWidth || 1280;
          const height = video.videoHeight || 720;
          setVideoDimensions({ width, height });

          let currentObjects: DetectedObject[] = [];
          let currentPoses: PoseVariantResult[] = [];
          let latency = 0;

          if (detectionMode === 'objects' || detectionMode === 'both') {
            const result = await runBrowserDetection(video, modelId, minConfidence, maxDetections);
            currentObjects = selectedClasses.length > 0
              ? result.objects.filter((o) => selectedClasses.includes(o.class))
              : result.objects;
            latency = result.latencyMs;
          }

          if (detectionMode === 'pose' || detectionMode === 'both') {
            currentPoses = await detectPoseVariants(
              video,
              poseSettings.activeVariant,
              poseSettings.minConfidence,
              currentObjects
            );
          }

          if (isMounted) {
            setDetectedObjects(currentObjects);
            setDetectedPoses(currentPoses);
            onNewDetections(currentObjects);
            onNewPoses?.(currentPoses);
            onUpdateTelemetry({
              inferenceTimeMs: latency,
              activeObjectCount: currentObjects.length,
              activePoseCount: currentPoses.length,
              currentResolution: { width, height },
              engineStatus: 'running',
            });
          }
        }
      } catch (err) {
        console.warn('Live detection cycle warning:', err);
      }

      if (isMounted) {
        animationFrameId.current = requestAnimationFrame(detectLoop);
      }
    };

    animationFrameId.current = requestAnimationFrame(detectLoop);
    return () => {
      isMounted = false;
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [
    modelId,
    minConfidence,
    maxDetections,
    selectedClasses,
    detectionMode,
    poseSettings,
    onUpdateTelemetry,
    onNewDetections,
    onNewPoses,
  ]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none"
    >
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="w-full h-full object-contain pointer-events-none"
      />

      {/* Real-time Bounding Box Overlay */}
      {(detectionMode === 'objects' || detectionMode === 'both') && (
        <BoundingBoxOverlay
          objects={detectedObjects}
          videoWidth={videoDimensions.width}
          videoHeight={videoDimensions.height}
          containerWidth={containerSize.width}
          containerHeight={containerSize.height}
          boxStyle={boxStyle}
          showConfidence={showConfidence}
          showCenterDot={showCenterDot}
          showTrackId={showTrackId}
          objectFit="contain"
        />
      )}

      {/* Real-time Pose & Variants Overlay */}
      {(detectionMode === 'pose' || detectionMode === 'both') && (
        <PoseOverlay
          poses={detectedPoses}
          videoWidth={videoDimensions.width}
          videoHeight={videoDimensions.height}
          containerWidth={containerSize.width}
          containerHeight={containerSize.height}
          settings={poseSettings}
          objectFit="contain"
        />
      )}

      {/* Camera Access Warning/Error Overlay */}
      {cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950/90 text-center z-10">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
            <Camera className="w-6 h-6 text-amber-500" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">Camera Stream Inactive</h3>
          <p className="text-xs text-slate-300 max-w-md mb-4">{cameraError}</p>
          <button
            onClick={startCamera}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-medium text-white transition-colors cursor-pointer"
          >
            Grant Camera Access
          </button>
        </div>
      )}
    </div>
  );
};
