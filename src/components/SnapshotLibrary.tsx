import React from 'react';
import { Camera, Trash2, ExternalLink, Calendar, Target } from 'lucide-react';
import { DetectionSnapshot } from '../types/detection';
import { formatConfidence } from '../utils/boxCalculations';

interface SnapshotLibraryProps {
  snapshots: DetectionSnapshot[];
  onSelectSnapshot: (snapshot: DetectionSnapshot) => void;
  onClearSnapshots: () => void;
}

export const SnapshotLibrary: React.FC<SnapshotLibraryProps> = ({
  snapshots,
  onSelectSnapshot,
  onClearSnapshots,
}) => {
  if (snapshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <Camera className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
          No Snapshots Captured Yet
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mb-4">
          Click the "Snapshot" button over the live camera or test stream to inspect and save frozen frames with bounding boxes.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Saved Detection Snapshots
          </h2>
          <p className="text-xs text-slate-500">
            Review frozen frames, confidence distributions, and target locations
          </p>
        </div>

        <button
          onClick={onClearSnapshots}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {snapshots.map((snap) => (
          <div
            key={snap.id}
            onClick={() => onSelectSnapshot(snap)}
            className="group cursor-pointer flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hover:border-cyan-500 transition-all shadow-xs hover:shadow-md"
          >
            <div className="relative aspect-video w-full bg-black overflow-hidden">
              <img
                src={snap.dataUrl}
                alt="Captured frame"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono bg-black/70 text-white backdrop-blur-xs">
                {snap.objects.length} Objects
              </div>
            </div>

            <div className="p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white">
                <span className="truncate">{snap.modelUsed}</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-500" />
              </div>

              <div className="flex flex-wrap gap-1 text-[11px] font-mono text-slate-500">
                {snap.objects.slice(0, 3).map((obj, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    {obj.class}: {formatConfidence(obj.score)}
                  </span>
                ))}
                {snap.objects.length > 3 && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    +{snap.objects.length - 3} more
                  </span>
                )}
              </div>

              <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-100 dark:border-slate-800">
                {new Date(snap.timestamp).toLocaleTimeString()} · Live Stream
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
