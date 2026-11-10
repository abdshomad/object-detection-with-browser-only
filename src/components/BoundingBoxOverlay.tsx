import React from 'react';
import { DetectedObject, BoxStyle } from '../types/detection';
import {
  formatConfidence,
  getConfidenceTheme,
  fitBoundingBoxToView,
} from '../utils/boxCalculations';

interface BoundingBoxOverlayProps {
  objects: DetectedObject[];
  videoWidth: number;
  videoHeight: number;
  containerWidth: number;
  containerHeight: number;
  boxStyle: BoxStyle;
  showConfidence: boolean;
  showCenterDot: boolean;
  showTrackId: boolean;
  objectFit?: 'contain' | 'cover';
}

export const BoundingBoxOverlay: React.FC<BoundingBoxOverlayProps> = ({
  objects,
  videoWidth,
  videoHeight,
  containerWidth,
  containerHeight,
  boxStyle,
  showConfidence,
  showCenterDot,
  showTrackId,
  objectFit = 'contain',
}) => {
  if (!videoWidth || !videoHeight || !containerWidth || !containerHeight || objects.length === 0) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none overflow-hidden"
      style={{ width: containerWidth, height: containerHeight }}
    >
      {objects.map((obj) => {
        const fitted = fitBoundingBoxToView(
          obj.bbox,
          videoWidth,
          videoHeight,
          containerWidth,
          containerHeight,
          objectFit
        );

        if (fitted.width <= 0 || fitted.height <= 0) return null;

        const confTheme = getConfidenceTheme(obj.score);
        const color = obj.color || confTheme.border;

        return (
          <div
            key={obj.id}
            className="absolute transition-all duration-75"
            style={{
              left: `${fitted.left}px`,
              top: `${fitted.top}px`,
              width: `${fitted.width}px`,
              height: `${fitted.height}px`,
            }}
          >
            {/* Box Border Styling */}
            {boxStyle === 'corners' ? (
              <div className="absolute inset-0">
                <div
                  className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2"
                  style={{ borderColor: color }}
                />
                <div
                  className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2"
                  style={{ borderColor: color }}
                />
                <div
                  className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2"
                  style={{ borderColor: color }}
                />
                <div
                  className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2"
                  style={{ borderColor: color }}
                />
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: `${color}10` }}
                />
              </div>
            ) : boxStyle === 'neon' ? (
              <div
                className="absolute inset-0 border-2 rounded-sm"
                style={{
                  borderColor: color,
                  boxShadow: `0 0 12px ${color}80, inset 0 0 6px ${color}30`,
                  backgroundColor: `${color}15`,
                }}
              />
            ) : boxStyle === 'minimal' ? (
              <div
                className="absolute inset-0 border border-dashed rounded-none"
                style={{ borderColor: color }}
              />
            ) : (
              <div
                className="absolute inset-0 border-2 rounded-sm"
                style={{
                  borderColor: color,
                  backgroundColor: `${color}12`,
                }}
              />
            )}

            {/* Label Badge with Class Name + Confidence Score */}
            <div
              className="absolute -top-6 left-0 flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono tracking-tight font-semibold shadow-md whitespace-nowrap z-10"
              style={{
                backgroundColor: color,
                color: '#FFFFFF',
              }}
            >
              <span className="capitalize">{obj.class}</span>

              {showConfidence && (
                <span className="opacity-95 font-bold tabular-nums pl-1 border-l border-white/30">
                  {formatConfidence(obj.score)}
                </span>
              )}

              {showTrackId && obj.trackingId && (
                <span className="opacity-75 text-[10px] pl-0.5">
                  #{obj.trackingId}
                </span>
              )}
            </div>

            {/* Center dot reticle */}
            {showCenterDot && (
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white"
                style={{ backgroundColor: color }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
