import React from 'react';
import {
  Activity,
  Cpu,
  Layers,
  Terminal,
  FolderGit2,
  CheckCircle2,
  ShieldCheck,
  Radio,
  Sparkles,
} from 'lucide-react';
import { EdgeResourceProfile } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeProfile: EdgeResourceProfile;
  setActiveDevice: (device: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeProfile,
  setActiveDevice,
}) => {
  const tabs = [
    { id: 'workbench', label: 'Field Triage Studio', icon: Activity },
    { id: 'causal_dag', label: 'Causal DAG & Do-Calculus', icon: Layers },
    { id: 'fvcb_kinetics', label: 'Biophysical Governor', icon: ShieldCheck },
    { id: 'mcp_console', label: 'MCP Edge Node', icon: Terminal },
    { id: 'benchmarks', label: 'Hardware & Invariants', icon: CheckCircle2 },
    { id: 'repository', label: 'Edge Compiler & Repo', icon: FolderGit2 },
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
      {/* Top Professional Sub-Bar */}
      <div className="bg-slate-950 px-4 py-1.5 border-b border-slate-800/80 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium font-mono">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            MCP Spec v2025-11-25 Active
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300 font-mono">Biophysical Farquhar Governor</span>
          <span className="text-slate-600">|</span>
          <span className="text-blue-400 font-mono">Pearlian SCM Counterfactuals</span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>Target Edge Device:</span>
            <select
              value={activeProfile.targetDevice}
              onChange={(e) => setActiveDevice(e.target.value)}
              className="bg-slate-900 text-emerald-400 border border-slate-700 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Raspberry Pi 4 (Cortex-A72)">Raspberry Pi 4 (Cortex-A72)</option>
              <option value="ESP32-S3 (Xtensa LX7)">ESP32-S3 (Xtensa LX7)</option>
              <option value="Pixel Edge TPU / Smartphone">Pixel Edge TPU / Smartphone</option>
              <option value="Local Laptop x86-64">Local Laptop x86-64</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">RAM:</span>
            <span className="text-amber-400 font-semibold">{activeProfile.ramUsageMB} MB</span>
            <span className="text-slate-500">/ {activeProfile.maxRamBudgetMB} MB</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 text-[11px]">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Zero-Cloud Verified</span>
          </div>
        </div>
      </div>

      {/* Main Header Brand & Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-600 via-teal-700 to-blue-800 flex items-center justify-center shadow-lg shadow-emerald-950/50 border border-emerald-400/30">
            <Sparkles className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white font-sans">
                Phyto<span className="text-emerald-400">Causal</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider font-semibold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                v1.0.0 Production
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous Biophysical Causal Inference for Precision Crop Stress Decoupling
            </p>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
