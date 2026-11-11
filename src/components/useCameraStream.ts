import { useState, useCallback, useEffect, RefObject } from 'react';

interface UseCameraStreamProps {
  facingMode: 'user' | 'environment';
  videoRef: RefObject<HTMLVideoElement | null>;
  enabled?: boolean;
}

export function useCameraStream({
  facingMode,
  videoRef,
  enabled = true,
}: UseCameraStreamProps) {
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access unavailable in this browser environment.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: { ideal: facingMode },
        },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to access camera';
      setCameraError(msg);
    }
  }, [facingMode, videoRef]);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, [videoRef]);

  useEffect(() => {
    if (!enabled) {
      stopCamera();
      return;
    }
    startCamera();
    return () => stopCamera();
  }, [enabled, facingMode, startCamera, stopCamera]);

  return { cameraError, startCamera, stopCamera };
}
