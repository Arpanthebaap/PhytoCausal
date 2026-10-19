import React, { useState, useMemo } from 'react';
import {
  Terminal,
  Play,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { AgriMCPServer } from '../core/mcp_server';
import { JSONRPCRequest, JSONRPCResponse } from '../types';

export const MCPConsole: React.FC = () => {
  const mcpServer = useMemo(() => new AgriMCPServer(), []);

  const sampleRequests: Record<string, JSONRPCRequest> = {
    initialize: {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-11-25',
        clientInfo: {
          name: 'edge-client-simulator',
          version: '1.0.0',
        },
      },
    },
    tools_list: {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    },
    disambiguate_stress: {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'phytocausal_disambiguate_stress',
        arguments: {
          soilTelemetry: {
            soilMatricPotentialKPa: -285.0,
            volumetricWaterContent: 0.138,
            bulkElectricalConductivity: 1.15,
            poreWaterConductivity: 2.1,
            soilTemperatureC: 28.4,
            poreWaterNitrateMgL: 72.0,
            soilDepthCm: 25,
            soilTextureClass: 'silt_loam',
          },
          canopyTraits: {
            chlorophyllIndexSPAD: 22.4,
            anthocyaninIndex: 0.18,
            canopyTempC: 34.6,
            ambientTempC: 30.5,
            canopyTempDeltaC: 4.1,
            stomatalConductanceProxy: 0.042,
            leafCurlingRatio: 0.78,
            excessGreenIndex: 0.12,
            normalizedDiffGreenRed: 0.08,
            internalCO2Ppm: 125,
            photosyntheticallyActiveRadiation: 1650,
          },
        },
      },
    },
    verify_biokinetics: {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'phytocausal_verify_biokinetics',
        arguments: {
          leafTempC: 32.5,
          ciPpm: 180.0,
          parUmols: 1400.0,
          stomatalConductance: 0.08,
          reportedAn: 26.5, // Intentionally impossible rate to test override
        },
      },
    },
    counterfactual_do: {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'phytocausal_counterfactual_do',
        arguments: {
          soilTelemetry: {
            soilMatricPotentialKPa: -285.0,
            poreWaterNitrateMgL: 72.0,
          },
          canopyTraits: {
            chlorophyllIndexSPAD: 22.4,
            stomatalConductanceProxy: 0.042,
            canopyTempDeltaC: 4.1,
          },
          query: {
            targetVariable: 'chlorophyllIndexSPAD',
            interventionNode: 'soilMatricPotentialKPa',
            interventionValue: -33.0,
          },
        },
      },
    },
    resources_list: {
      jsonrpc: '2.0',
      id: 6,
      method: 'resources/list',
      params: {},
    },
    resources_read: {
      jsonrpc: '2.0',
      id: 7,
      method: 'resources/read',
      params: {
        uri: 'phytocausal://agronomy/fvcb-c3-constants',
      },
    },
  };

  const [activeTemplate, setActiveTemplate] = useState<string>('disambiguate_stress');
  const [requestText, setRequestText] = useState<string>(
    JSON.stringify(sampleRequests['disambiguate_stress'], null, 2)
  );
  const [responseText, setResponseText] = useState<string>('');
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [streamLogs, setStreamLogs] = useState<Array<{ type: 'stdin' | 'stdout'; text: string; time: string }>>([
    {
      type: 'stdout',
      text: '[SYS_INIT] PhytoCausal MCP Server v1.2.0 listening on POSIX standard I/O streams (fd:0, fd:1)',
      time: '00:00:01',
    },
  ]);

  const handleSelectTemplate = (key: string) => {
    setActiveTemplate(key);
    setRequestText(JSON.stringify(sampleRequests[key], null, 2));
  };

  const handleExecute = async () => {
    try {
      const parsedReq = JSON.parse(requestText) as JSONRPCRequest;
      const startTime = performance.now();

      // Dispatch to full-stack Express MCP server endpoint (/api/mcp) with edge fallback
      let resp: JSONRPCResponse;
      try {
        const netResp = await fetch('/api/mcp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsedReq),
        });
        if (netResp.ok) {
          resp = await netResp.json();
        } else {
          resp = await mcpServer.handleJsonRpc(parsedReq);
        }
      } catch {
        resp = await mcpServer.handleJsonRpc(parsedReq);
      }

      const endTime = performance.now();
      const elapsed = Number((endTime - startTime).toFixed(2));

      setExecutionTimeMs(elapsed);
      setResponseText(JSON.stringify(resp, null, 2));

      // Append to live stdio stream log
      const now = new Date().toLocaleTimeString();
      setStreamLogs((prev) => [
        ...prev.slice(-12),
        { type: 'stdin', text: `> ${JSON.stringify(parsedReq)}`, time: now },
        { type: 'stdout', text: `< ${JSON.stringify(resp)}`, time: now },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setResponseText(
        JSON.stringify(
          {
            jsonrpc: '2.0',
            id: null,
            error: { code: -32700, message: `JSON Parse error: ${msg}` },
          },
          null,
          2
        )
      );
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(responseText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-slate-900 text-emerald-400">
                Spec v2025-11-25
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Model Context Protocol (MCP) JSON-RPC 2.0 Engine
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Interact with the localized Python/Node MCP orchestration node. Execute tool calls,
              read agronomic knowledge base resources, and inspect bidirectional byte streams over edge transport.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 font-mono text-xs font-semibold">
              Transport: stdio / FIFO
            </span>
          </div>
        </div>
      </div>

      {/* Quick Template Picker */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-slate-500 font-medium shrink-0">Pre-built RPC Calls:</span>
        {Object.keys(sampleRequests).map((key) => (
          <button
            key={key}
            onClick={() => handleSelectTemplate(key)}
            className={`px-3 py-1.5 rounded-lg border font-mono whitespace-nowrap cursor-pointer transition-all ${
              activeTemplate === key
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Two-Column Editor & Response Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Column */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 shadow-sm flex flex-col overflow-hidden">
          <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2 font-mono">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Standard Input Stream (stdin)</span>
            </div>
            <button
              onClick={handleExecute}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors cursor-pointer shadow-xs"
            >
              <Play className="w-3.5 h-3.5" />
              Dispatch RPC
            </button>
          </div>

          <textarea
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
            className="w-full h-80 p-4 bg-transparent font-mono text-xs text-emerald-300 focus:outline-none resize-none selection:bg-slate-800"
            spellCheck={false}
          />

          <div className="p-2.5 bg-slate-900/60 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono flex items-center justify-between">
            <span>Protocol: JSON-RPC 2.0</span>
            <span>Encoding: UTF-8</span>
          </div>
        </div>

        {/* Response Column */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 shadow-sm flex flex-col overflow-hidden">
          <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2 font-mono">
              <Terminal className="w-4 h-4 text-blue-400" />
              <span>Standard Output Stream (stdout)</span>
            </div>

            <div className="flex items-center gap-3">
              {executionTimeMs !== null && (
                <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                  Latency: {executionTimeMs} ms
                </span>
              )}
              {responseText && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
          </div>

          <div className="w-full h-80 p-4 font-mono text-xs overflow-auto text-blue-300">
            {responseText ? (
              <pre className="whitespace-pre-wrap">{responseText}</pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
                <Terminal className="w-8 h-8 opacity-40" />
                <p>Click "Dispatch RPC" to execute the active JSON-RPC request.</p>
              </div>
            )}
          </div>

          <div className="p-2.5 bg-slate-900/60 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono flex items-center justify-between">
            <span>Status: {responseText ? 'Response 200 OK' : 'Awaiting input'}</span>
            <span>Zero-Cloud Edge Transport</span>
          </div>
        </div>
      </div>

      {/* Live Raw Stdio Stream Monitor */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2 pb-2 border-b border-slate-800">
          <span className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            Real-time Edge Stdio Stream Bus (Raspberry Pi FIFO / UART Simulation)
          </span>
          <span className="text-slate-500">Sub-millisecond buffered</span>
        </div>

        <div className="font-mono text-[11px] space-y-1 max-h-36 overflow-y-auto">
          {streamLogs.map((log, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2 ${
                log.type === 'stdin' ? 'text-emerald-400' : 'text-blue-300'
              }`}
            >
              <span className="text-slate-600 shrink-0">[{log.time}]</span>
              <span className="break-all">{log.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
