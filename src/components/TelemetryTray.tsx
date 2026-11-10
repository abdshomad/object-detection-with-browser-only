import React from 'react';
import { Activity, Clock, Target, ListFilter } from 'lucide-react';
import { TelemetryStats, DetectedObject } from '../types/detection';
import { formatConfidence } from '../utils/boxCalculations';

interface TelemetryTrayProps {
  stats: TelemetryStats;
  currentObjects: DetectedObject[];
}

export const TelemetryTray: React.FC<TelemetryTrayProps> = ({
  stats,
  currentObjects,
}) => {
  // Aggregate counts by class
  const classCounts: Record<string, number> = {};
  for (const obj of currentObjects) {
    classCounts[obj.class] = (classCounts[obj.class] || 0) + 1;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-slate-800 dark:text-slate-100">
      {/* Metric 1: FPS */}
      <div className="flex flex-col p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
          <span className="uppercase tracking-wider">Stream Rate</span>
          <Activity className="w-3.5 h-3.5 text-cyan-500" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {stats.fps}
          </span>
          <span className="text-xs uppercase font-mono text-slate-500">FPS</span>
        </div>
        <span className="text-[11px] text-slate-500 mt-1">
          {stats.fps >= 24 ? 'Smooth real-time' : stats.fps > 10 ? 'Moderate rate' : 'Processing frame'}
        </span>
      </div>

      {/* Metric 2: Inference Latency */}
      <div className="flex flex-col p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
          <span className="uppercase tracking-wider">Inference Latency</span>
          <Clock className="w-3.5 h-3.5 text-amber-500" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {stats.inferenceTimeMs}
          </span>
          <span className="text-xs uppercase font-mono text-slate-500">MS</span>
        </div>
        <span className="text-[11px] text-slate-500 mt-1">
          {stats.inferenceTimeMs < 35 ? 'Edge accelerated' : 'Standard WebGL'}
        </span>
      </div>

      {/* Metric 3: Active Objects Count */}
      <div className="flex flex-col p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
          <span className="uppercase tracking-wider">Active Targets</span>
          <Target className="w-3.5 h-3.5 text-emerald-500" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {currentObjects.length}
          </span>
          <span className="text-xs uppercase font-mono text-slate-500">Detected</span>
        </div>
        <span className="text-[11px] text-slate-500 mt-1">
          {Object.keys(classCounts).length} unique classes
        </span>
      </div>

      {/* Metric 4: Classes Breakdown */}
      <div className="flex flex-col p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
          <span className="uppercase tracking-wider">Class Distribution</span>
          <ListFilter className="w-3.5 h-3.5 text-indigo-500" />
        </div>
        <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-12 mt-1">
          {Object.keys(classCounts).length === 0 ? (
            <span className="text-xs text-slate-400 italic">No targets in frame</span>
          ) : (
            Object.entries(classCounts).map(([cls, count]) => (
              <span
                key={cls}
                className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
              >
                <span className="capitalize">{cls}</span>
                <span className="opacity-70">x{count}</span>
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
