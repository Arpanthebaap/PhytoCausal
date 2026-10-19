/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { DiagnosticWorkbench } from './components/DiagnosticWorkbench';
import { CausalGraphViewer } from './components/CausalGraphViewer';
import { FvCBKineticViewer } from './components/FvCBKineticViewer';
import { MCPConsole } from './components/MCPConsole';
import { RepositoryHub } from './components/RepositoryHub';
import { BenchmarkRunner } from './components/BenchmarkRunner';
import { EdgeResourceRouter } from './core/resource_router';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('workbench');
  const [activeDevice, setActiveDevice] = useState<string>('Raspberry Pi 4 (Cortex-A72)');

  const resourceRouter = useMemo(() => new EdgeResourceRouter(), []);
  const activeProfile = useMemo(() => {
    return resourceRouter.getProfile(activeDevice as any);
  }, [resourceRouter, activeDevice]);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Scientific Navbar with Live Edge Diagnostics */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeProfile={activeProfile}
        setActiveDevice={setActiveDevice}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'workbench' && <DiagnosticWorkbench />}
        {activeTab === 'causal_dag' && <CausalGraphViewer />}
        {activeTab === 'fvcb_kinetics' && <FvCBKineticViewer />}
        {activeTab === 'mcp_console' && <MCPConsole />}
        {activeTab === 'benchmarks' && <BenchmarkRunner />}
        {activeTab === 'repository' && <RepositoryHub />}
      </main>

      {/* Industrial Scientific Footer */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4 font-mono">
          <div>
            <span className="text-white font-bold font-sans">PhytoCausal</span> — Autonomous Biophysical Causal Agroecosystem Engine
            <div className="text-[11px] text-slate-500 font-sans mt-0.5">
              Production-Grade Edge Computing Architecture & Local Model Context Protocol
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-emerald-400">Model Context Protocol v2025-11-25</span>
            <span className="text-slate-600">|</span>
            <span>100% Zero-Cloud Offline Inference</span>
            <span className="text-slate-600">|</span>
            <span>Farquhar-von Caemmerer-Berry Governed</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
