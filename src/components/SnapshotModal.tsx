import React from 'react';
import { X, Download, Copy, Check, Calendar, Cpu } from 'lucide-react';
import { DetectionSnapshot } from '../types/detection';
import { formatConfidence } from '../utils/boxCalculations';

interface SnapshotModalProps {
  snapshot: DetectionSnapshot | null;
  onClose: () => void;
}

export const SnapshotModal: React.FC<SnapshotModalProps> = ({
  snapshot,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!snapshot) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(
      JSON.stringify(
        {
          timestamp: new Date(snapshot.timestamp).toISOString(),
          model: snapshot.modelUsed,
          objectsCount: snapshot.objects.length,
          detections: snapshot.objects.map((o) => ({
            class: o.class,
            confidence: formatConfidence(o.score),
            scoreRaw: o.score,
            bbox: o.bbox,
          })),
          posesCount: snapshot.poses?.length || 0,
          poses: snapshot.poses?.map((p) => ({
            variant: p.variant,
            label: p.label,
            confidence: formatConfidence(p.score),
            keypointsCount: p.keypoints.length,
          })) || [],
        },
        null,
        2
      )
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = () => {
    const a = document.createElement('a');
    a.href = snapshot.dataUrl;
    a.download = `visionedge-snapshot-${snapshot.timestamp}.jpg`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Inspection Frame Snapshot
            </h3>
            <span className="text-xs font-mono text-slate-500">
              Captured: {new Date(snapshot.timestamp).toLocaleTimeString()} · {snapshot.modelUsed}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          {/* Snapshot Image Preview */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-slate-800">
            <img
              src={snapshot.dataUrl}
              alt="Snapshot capture"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Detections Breakdown Table */}
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Identified Targets ({snapshot.objects.length})
            </h4>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-2">Class</th>
                    <th className="px-4 py-2">Confidence</th>
                    <th className="px-4 py-2">Bounding Box [X, Y, W, H]</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {snapshot.objects.map((obj, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-2.5 font-semibold capitalize text-slate-900 dark:text-white">
                        {obj.class}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatConfidence(obj.score)}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 tabular-nums">
                        [{obj.bbox.join(', ')}]
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          Verified
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Poses Breakdown */}
          {snapshot.poses && snapshot.poses.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Identified Poses & Skeletons ({snapshot.poses.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {snapshot.poses.map((p, pIdx) => (
                  <div
                    key={pIdx}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-mono flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="text-slate-900 dark:text-white font-semibold">{p.label}</span>
                    <span className="text-slate-500">({p.keypoints.length} pts)</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {formatConfidence(p.score)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <div className="text-xs font-mono text-slate-500">
            Latency: {snapshot.inferenceTimeMs}ms · Live Stream
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied JSON' : 'Copy JSON'}</span>
            </button>

            <button
              onClick={handleDownloadImage}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-medium text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Image</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
