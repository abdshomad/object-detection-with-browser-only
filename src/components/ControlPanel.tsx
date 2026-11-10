import React from 'react';
import { Sliders, Filter, Sparkles, Volume2, VolumeX, Eye } from 'lucide-react';
import { BoxStyle } from '../types/detection';
import { COMMON_COCO_CLASSES } from '../../data/mockup/mockModels';

interface ControlPanelProps {
  minConfidence: number;
  onChangeMinConfidence: (val: number) => void;
  maxDetections: number;
  onChangeMaxDetections: (val: number) => void;
  selectedClasses: string[];
  onToggleClass: (className: string) => void;
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
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
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
}) => {
  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Detector Parameters & Display
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400">Real-time Tuning</span>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Confidence Threshold */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-600 dark:text-slate-300">Min Confidence Threshold</span>
            <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold tabular-nums">
              {(minConfidence * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="0.95"
            step="0.05"
            value={minConfidence}
            onChange={(e) => onChangeMinConfidence(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>10% (Sensitive)</span>
            <span>50%</span>
            <span>95% (Strict)</span>
          </div>
        </div>

        {/* Max Detections */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-600 dark:text-slate-300">Max Detections Per Frame</span>
            <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold tabular-nums">
              {maxDetections} targets
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="25"
            step="1"
            value={maxDetections}
            onChange={(e) => onChangeMaxDetections(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>1</span>
            <span>12</span>
            <span>25</span>
          </div>
        </div>
      </div>

      {/* Bounding Box Appearance & Toggles */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
          Bounding Box Style
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(
            [
              { id: 'neon', label: 'Neon Glow' },
              { id: 'contrast', label: 'Solid Contrast' },
              { id: 'corners', label: 'Corner Reticle' },
              { id: 'minimal', label: 'Minimal Outline' },
            ] as const
          ).map((style) => (
            <button
              key={style.id}
              onClick={() => onChangeBoxStyle(style.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border text-center transition-colors whitespace-nowrap ${
                boxStyle === style.id
                  ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 text-cyan-700 dark:text-cyan-300 font-semibold'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showConfidence}
            onChange={onToggleShowConfidence}
            className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
          />
          <span className="text-slate-700 dark:text-slate-300">Display Confidence Score (%)</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showCenterDot}
            onChange={onToggleShowCenterDot}
            className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
          />
          <span className="text-slate-700 dark:text-slate-300">Center Reticle</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showTrackId}
            onChange={onToggleShowTrackId}
            className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
          />
          <span className="text-slate-700 dark:text-slate-300">Tracking IDs</span>
        </label>

        <button
          onClick={onToggleAudioAlert}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
            audioAlert
              ? 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-500 text-cyan-600 dark:text-cyan-300'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
          }`}
        >
          {audioAlert ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span>Audio Cue</span>
        </button>
      </div>

      {/* Target Class Filter Bar */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Target Class Filter ({selectedClasses.length === 0 ? 'All Classes' : `${selectedClasses.length} Selected`})
          </span>
          {selectedClasses.length > 0 && (
            <button
              onClick={onClearClassFilters}
              className="text-cyan-600 dark:text-cyan-400 hover:underline text-[11px]"
            >
              Reset to All
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
          {COMMON_COCO_CLASSES.map((cls) => {
            const isSelected = selectedClasses.includes(cls);
            return (
              <button
                key={cls}
                onClick={() => onToggleClass(cls)}
                className={`px-2 py-0.5 text-xs rounded-md border transition-colors whitespace-nowrap capitalize ${
                  isSelected
                    ? 'bg-cyan-600 border-cyan-600 text-white font-medium'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                {cls}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
