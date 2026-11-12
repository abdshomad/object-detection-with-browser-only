import React from 'react';
import {
  Check,
  Download,
  Loader2,
  HardDrive,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  Server,
  MonitorSmartphone,
} from 'lucide-react';
import { ModelOption } from '../types/detection';

interface ModelSelectorProps {
  models: ModelOption[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  onDownloadModel: (modelId: string) => void;
  loadingModelId?: string | null;
  onUploadModel?: (file: File, name: string) => Promise<string>;
  onDeleteModel?: (id: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModelId,
  onSelectModel,
  onDownloadModel,
  loadingModelId = null,
  onUploadModel,
  onDeleteModel,
}) => {
  const [uploadName, setUploadName] = React.useState('');
  const [uploadBusy, setUploadBusy] = React.useState(false);
  const [uploadMsg, setUploadMsg] = React.useState<string | null>(null);
  const groups = [
    {
      key: 'server',
      title: 'Server GPU Models',
      description: 'Weights in models/ on this server — inference runs on the server NVIDIA GPU',
      icon: Server,
      models: models.filter((m) => m.backend === 'Server GPU'),
    },
    {
      key: 'browser',
      title: 'Browser Models',
      description: 'Real-time edge runtimes running 100% on-device in your browser',
      icon: MonitorSmartphone,
      models: models.filter((m) => m.backend !== 'Server GPU'),
    },
  ];

  return (
    <div className="w-full flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Object Detection Models ({models.length} Models)
          </h2>
          <p className="text-xs text-slate-400">
            Server GPU models run on this server · Browser models run on your device
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Ready:</span>
          <span className="font-semibold text-emerald-400">
            {models.filter((m) => m.downloadStatus === 'ready').length} / {models.length}
          </span>
        </div>
      </div>

      {/* Upload custom YOLO model */}
      <div className="flex flex-col gap-2 p-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/60">
        <span className="text-sm font-semibold text-white">Upload Your YOLO26 Model (.pt)</span>
        <p className="text-xs text-slate-400">
          Upload a YOLO26n (or any YOLO detection) checkpoint trained on your classes. It is validated and
          saved on the server, then appears under Server GPU Models — select it and run it on camera,
          YouTube/Drive/RTSP, or an uploaded video.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 mt-1">
          <input
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
            placeholder="Model name (optional)"
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <label className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-medium text-white transition-all cursor-pointer">
            {uploadBusy ? 'Uploading…' : 'Choose .pt file & Upload'}
            <input
              type="file"
              accept=".pt"
              className="hidden"
              disabled={uploadBusy}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (!f || !onUploadModel) return;
                setUploadBusy(true);
                setUploadMsg(null);
                try {
                  const id = await onUploadModel(f, uploadName.trim());
                  setUploadMsg(`Uploaded — now select “Load on Server GPU” for your model below.`);
                  onSelectModel(id);
                } catch (err: unknown) {
                  setUploadMsg(err instanceof Error ? err.message : 'Upload failed');
                } finally {
                  setUploadBusy(false);
                }
              }}
            />
          </label>
        </div>
        {uploadMsg && <p className="text-xs text-cyan-200 bg-cyan-950/40 border border-cyan-500/30 rounded-lg px-3 py-2">{uploadMsg}</p>}
      </div>

      {groups.map((group) => (
        <div key={group.key} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <group.icon className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              {group.title}
            </h3>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {group.models.length}
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">{group.description}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {group.models.map((model) => {
          const isSelected = model.id === selectedModelId;
          const isDownloading = model.downloadStatus === 'downloading' || loadingModelId === model.id;
          const isReady = model.downloadStatus === 'ready';

          return (
            <div
              key={model.id}
              className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all text-slate-100 ${
                isSelected
                  ? 'border-cyan-500 bg-cyan-950/30 ring-1 ring-cyan-500/40 shadow-md'
                  : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header: Family, Name & Status Badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">
                        {model.family}
                      </span>
                      {model.huggingFaceUrl && (
                        <a
                          href={model.huggingFaceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View on Hugging Face Hub"
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30 transition-colors"
                        >
                          <span>HuggingFace</span>
                          <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                        </a>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                      {model.name}
                    </h3>
                  </div>

                  {model.id.startsWith('custom-') && onDeleteModel && (
                    <button
                      onClick={() => onDeleteModel(model.id)}
                      title="Delete this uploaded model from the server"
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-950/60 text-red-300 border border-red-500/30 hover:bg-red-900/60 cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                  {/* Status Indicator Badge */}
                  {isReady ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                      <Check className="w-3 h-3 text-emerald-400" />
                      Ready to Use
                    </span>
                  ) : isDownloading ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                      Loading {model.downloadProgress || 50}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-950/50 text-amber-300 border border-amber-500/30">
                      <HardDrive className="w-3 h-3 text-amber-400" />
                      Not Downloaded
                    </span>
                  )}
                </div>

                {/* Tagline */}
                <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                  {model.tagline}
                </p>

                {/* Specs Grid */}
                <div className="grid grid-cols-4 gap-2 p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] font-mono mb-3">
                  <div>
                    <span className="text-slate-500 block">LATENCY</span>
                    <span className="font-semibold text-slate-200">~{model.expectedLatencyMs}ms</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ACCURACY</span>
                    <span className="font-semibold text-emerald-400">{model.confidenceAccuracy}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">SIZE</span>
                    <span className="font-semibold text-slate-200">{model.sizeMb}MB</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">BACKEND</span>
                    <span className="font-semibold text-cyan-400">{model.backend}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Load / Select */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-mono text-slate-500">
                  {model.inputResolution} · {model.cocoClassesCount} Classes
                </span>

                <div className="flex items-center gap-2">
                  {!isReady ? (
                    <button
                      onClick={() => onDownloadModel(model.id)}
                      disabled={isDownloading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:scale-95 disabled:opacity-50 text-xs font-medium text-white transition-all cursor-pointer shadow-sm"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>{model.backend === 'Server GPU' ? 'Load on Server GPU' : 'Load into Browser'}</span>
                        </>
                      )}
                    </button>
                  ) : isSelected ? (
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500 text-xs font-semibold text-cyan-300">
                      <Check className="w-3.5 h-3.5" />
                      <span>Active Engine</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => onSelectModel(model.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors cursor-pointer"
                    >
                      Select Engine
                    </button>
                  )}
                </div>
              </div>
              </div>
            );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
