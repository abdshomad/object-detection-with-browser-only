import React from 'react';
import { PoseVariantResult, PoseSettings } from '../types/pose';
import {
  fitPoseKeypointToView,
  getPoseStyleColors,
  getConnectionColor,
} from '../utils/poseCalculations';

interface PoseOverlayProps {
  poses: PoseVariantResult[];
  videoWidth: number;
  videoHeight: number;
  containerWidth: number;
  containerHeight: number;
  settings: PoseSettings;
  objectFit?: 'contain' | 'cover';
}

export const PoseOverlay: React.FC<PoseOverlayProps> = ({
  poses,
  videoWidth,
  videoHeight,
  containerWidth,
  containerHeight,
  settings,
  objectFit = 'contain',
}) => {
  if (
    !settings.enabled ||
    poses.length === 0 ||
    !videoWidth ||
    !videoHeight ||
    !containerWidth ||
    !containerHeight
  ) {
    return null;
  }

  const { glow, joint } = getPoseStyleColors(settings.style);

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none overflow-hidden"
      style={{ width: containerWidth, height: containerHeight }}
    >
      <svg
        className="w-full h-full"
        style={{ width: containerWidth, height: containerHeight }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="pose-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {poses.map((pose) => {
          // Map all keypoints to current screen container pixels
          const fittedPoints = pose.keypoints.map((pt) =>
            fitPoseKeypointToView(
              pt,
              videoWidth,
              videoHeight,
              containerWidth,
              containerHeight,
              objectFit
            )
          );

          // Find anchor for label badge (highest point)
          let minY = Infinity;
          let anchorX = containerWidth / 2;
          fittedPoints.forEach((p) => {
            if (p.y < minY) {
              minY = p.y;
              anchorX = p.x;
            }
          });

          return (
            <g key={pose.id} filter="url(#pose-glow)">
              {/* Skeletal Bone Connections */}
              {settings.showSkeleton &&
                pose.connections.map((conn, cIdx) => {
                  const p1 = fittedPoints[conn.start];
                  const p2 = fittedPoints[conn.end];
                  if (!p1 || !p2 || p1.score < settings.minConfidence || p2.score < settings.minConfidence) {
                    return null;
                  }

                  const strokeColor = pose.color || getConnectionColor(conn.start, conn.end, settings.style);

                  return (
                    <line
                      key={`conn-${cIdx}`}
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={strokeColor}
                      strokeWidth={settings.lineWidth}
                      strokeLinecap="round"
                      strokeOpacity={0.9}
                    />
                  );
                })}

              {/* Joint Keypoint Circles */}
              {settings.showKeypoints &&
                fittedPoints.map((p, kIdx) => {
                  if (p.score < settings.minConfidence) return null;
                  const pointColor = pose.color || joint;

                  return (
                    <g key={`pt-${kIdx}`}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={settings.pointRadius + 1.5}
                        fill={glow}
                        opacity={0.4}
                      />
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={settings.pointRadius}
                        fill={pointColor}
                        stroke="#ffffff"
                        strokeWidth={1}
                      />
                    </g>
                  );
                })}

              {/* Pose Label Badge */}
              {settings.showLabels && minY < Infinity && (
                <g transform={`translate(${anchorX - 45}, ${Math.max(10, minY - 24)})`}>
                  <rect
                    width={90}
                    height={18}
                    rx={4}
                    fill="rgba(15, 23, 42, 0.85)"
                    stroke={pose.color || joint}
                    strokeWidth={1}
                  />
                  <text
                    x={45}
                    y={13}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize={10}
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {pose.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
