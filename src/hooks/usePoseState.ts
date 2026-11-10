import { useState, useCallback } from 'react';
import { DetectionMode, PoseSettings, PoseVariant, PoseVariantResult } from '../types/pose';

export function usePoseState() {
  const [detectionMode, setDetectionMode] = useState<DetectionMode>('both');
  const [poseSettings, setPoseSettings] = useState<PoseSettings>({
    enabled: true,
    activeVariant: 'body',
    style: 'neon',
    minConfidence: 0.35,
    showKeypoints: true,
    showSkeleton: true,
    pointRadius: 3,
    lineWidth: 2,
    showLabels: true,
  });
  const [currentPoses, setCurrentPoses] = useState<PoseVariantResult[]>([]);

  const handleUpdatePoseSettings = useCallback((patch: Partial<PoseSettings>) => {
    setPoseSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleCyclePoseVariant = useCallback(() => {
    const variants: PoseVariant[] = ['body', 'hands', 'face', 'holistic'];
    setPoseSettings((prev) => {
      const curIdx = variants.indexOf(prev.activeVariant);
      const nextVariant = variants[(curIdx + 1) % variants.length];
      return { ...prev, activeVariant: nextVariant };
    });
  }, []);

  return {
    detectionMode,
    setDetectionMode,
    poseSettings,
    handleUpdatePoseSettings,
    handleCyclePoseVariant,
    currentPoses,
    setCurrentPoses,
  };
}
