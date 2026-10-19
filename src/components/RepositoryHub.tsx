import React, { useState } from 'react';
import {
  FolderGit2,
  FileCode,
  FileText,
  Copy,
  Check,
  Download,
  Terminal,
  ExternalLink,
  ChevronRight,
  Folder,
} from 'lucide-react';
import { REPOSITORY_FILES, RepoFile } from '../data/repository_files';

export const RepositoryHub: React.FC = () => {
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const activeFile: RepoFile = REPOSITORY_FILES[selectedFileIndex] || REPOSITORY_FILES[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile.path.split('/').pop() || 'file.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const handleDownloadAll = () => {
    // Downloads all repository files concatenated into a unified setup bundle
    let bundle = `# PhytoCausal Edge-Compiled Agroecosystem Repository Bundle\n# Autonomous Biophysical Causal Inference Framework\n\n`;
    REPOSITORY_FILES.forEach((f) => {
      bundle += `\n# ==============================================================================\n`;
      bundle += `# FILE: ${f.path}\n`;
      bundle += `# ==============================================================================\n\n`;
      bundle += f.content;
      bundle += `\n\n`;
    });

    const blob = new Blob([bundle], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'phytocausal-edge-complete-repository.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-slate-900 text-emerald-400">
                Production Repository Hub
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Edge-Compiled Python Agri-MCP Server Codebase
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Clean modular layout following industrial open-source standards. Inspect any module, copy source code,
              or export the complete repository bundle for execution on a Raspberry Pi 4 or edge device.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              {downloadSuccess ? 'Downloaded!' : 'Export All Repository Code'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: File Tree + Code Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: File Tree Explorer */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-blue-600" />
              agri-mcp-edge/
            </span>
            <span className="text-[10px] text-slate-400">{REPOSITORY_FILES.length} Files</span>
          </div>

          <div className="space-y-1 text-xs font-mono">
            {REPOSITORY_FILES.map((file, idx) => {
              const isSelected = selectedFileIndex === idx;
              const isPy = file.path.endsWith('.py');
              const isMd = file.path.endsWith('.md');

              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFileIndex(idx)}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                      : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {isPy ? (
                      <FileCode className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                    <span className="truncate">{file.path}</span>
                  </div>
                  {isSelected && <ChevronRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-200 pt-3 mt-4 text-[11px] text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700">Quick Edge Terminal Run:</div>
            <div className="bg-slate-900 text-slate-300 p-2 rounded text-[10px] font-mono space-y-1">
              <div>$ pip install -r requirements.txt</div>
              <div>$ pytest tests/ -v</div>
              <div className="text-emerald-400">$ python src/main.py</div>
            </div>
          </div>
        </div>

        {/* Right: Code Viewer */}
        <div className="lg:col-span-8 bg-slate-950 rounded-xl border border-slate-800 shadow-sm flex flex-col overflow-hidden">
          {/* File Header Bar */}
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2 font-mono">
              <span className="text-emerald-400 font-bold">{activeFile.path}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 text-[11px]">{activeFile.description}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-[11px]"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy Code'}
              </button>
              <button
                onClick={handleDownloadFile}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-[11px]"
              >
                <Download className="w-3 h-3" />
                Download
              </button>
            </div>
          </div>

          {/* Code Text Body */}
          <div className="w-full h-[520px] p-4 font-mono text-xs overflow-auto text-slate-200 selection:bg-slate-800 leading-relaxed">
            <pre className="whitespace-pre">{activeFile.content}</pre>
          </div>

          {/* Footer Metadata */}
          <div className="p-2.5 bg-slate-900/70 border-t border-slate-800 text-[11px] text-slate-400 font-mono flex items-center justify-between">
            <span>Encoding: UTF-8 • LF</span>
            <span>Lines: {activeFile.content.split('\n').length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
