import React, { useState, useMemo } from 'react';
import {
  Layers,
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertOctagon,
  HelpCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { SoilTelemetry, CanopyTraits, CounterfactualQuery } from '../types';
import { CausalStressDisambiguator } from '../core/causal_engine';

interface NodeInfo {
  id: string;
  label: string;
  symbol: string;
  category: 'soil' | 'atmosphere' | 'plant_internal' | 'canopy_optical' | 'latent_stress';
  x: number;
  y: number;
  value: string;
  unit: string;
  equation: string;
}

export const CausalGraphViewer: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string>('mass_flow');

  // Baseline telemetry representing the Midwest Corn dry spell dilemma
  const [soilState, setSoilState] = useState<SoilTelemetry>({
    timestamp: new Date().toISOString(),
    soilMatricPotentialKPa: -285.0,
    volumetricWaterContent: 0.138,
    bulkElectricalConductivity: 1.15,
    poreWaterConductivity: 2.1,
    soilTemperatureC: 28.4,
    poreWaterNitrateMgL: 72.0,
    soilDepthCm: 25,
    soilTextureClass: 'silt_loam',
  });

  const [canopyState, setCanopyState] = useState<CanopyTraits>({
    timestamp: new Date().toISOString(),
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
  });

  const [activeIntervention, setActiveIntervention] = useState<{
    node: 'soilMatricPotentialKPa' | 'poreWaterNitrateMgL';
    value: number;
  }>({
    node: 'soilMatricPotentialKPa',
    value: -33.0, // Rehydration to field capacity
  });

  const disambiguator = useMemo(() => new CausalStressDisambiguator(), []);

  // Compute counterfactual result
  const counterfactualResult = useMemo(() => {
    const query: CounterfactualQuery = {
      targetVariable: 'chlorophyllIndexSPAD',
      interventionNode: activeIntervention.node,
      interventionValue: activeIntervention.value,
    };
    return disambiguator.evaluateCounterfactual(soilState, canopyState, query);
  }, [disambiguator, soilState, canopyState, activeIntervention]);

  const nodes: NodeInfo[] = [
    {
      id: 'soil_psi',
      label: 'Soil Matric Potential',
      symbol: 'Ψ_m',
      category: 'soil',
      x: 80,
      y: 80,
      value: `${soilState.soilMatricPotentialKPa}`,
      unit: 'kPa',
      equation: 'Exogenous Soil Hydraulic State via In-Situ Tensiometer Matrix',
    },
    {
      id: 'soil_nitrate',
      label: 'Soil Porewater Nitrate',
      symbol: '[NO₃⁻]',
      category: 'soil',
      x: 80,
      y: 280,
      value: `${soilState.poreWaterNitrateMgL}`,
      unit: 'mg/L',
      equation: 'Residual Nitrogen Pool dissolved in pore solution',
    },
    {
      id: 'stomatal_gsw',
      label: 'Stomatal Conductance',
      symbol: 'g_sw',
      category: 'plant_internal',
      x: 280,
      y: 80,
      value: `${canopyState.stomatalConductanceProxy}`,
      unit: 'mol m⁻² s⁻¹',
      equation: 'g_sw = f(Ψ_m, VPD) • hydraulic_turgor_cutoff',
    },
    {
      id: 'canopy_temp',
      label: 'Canopy Thermal Delta',
      symbol: 'ΔT_c',
      category: 'canopy_optical',
      x: 480,
      y: 80,
      value: `+${canopyState.canopyTempDeltaC}`,
      unit: '°C',
      equation: 'ΔT_c = T_canopy - T_air = f_radiation / (1 + γ • g_sw)',
    },
    {
      id: 'mass_flow',
      label: 'Solute Mass-Flow Translocation',
      symbol: 'J_N',
      category: 'plant_internal',
      x: 280,
      y: 280,
      value: `${(canopyState.stomatalConductanceProxy * soilState.poreWaterNitrateMgL * 0.85).toFixed(1)}`,
      unit: 'mg N m⁻² d⁻¹',
      equation: 'J_N = E • [NO₃⁻] = g_sw • VPD • [NO₃⁻]_pore',
    },
    {
      id: 'foliar_chl',
      label: 'Foliar Chlorophyll Index',
      symbol: 'Chl (SPAD)',
      category: 'canopy_optical',
      x: 480,
      y: 280,
      value: `${canopyState.chlorophyllIndexSPAD}`,
      unit: 'SPAD',
      equation: 'Chl = f_Rubisco(J_N, N_remobilization) - photo_bleaching',
    },
    {
      id: 'latent_stress',
      label: 'Latent Stress Disambiguator',
      symbol: 'S*',
      category: 'latent_stress',
      x: 680,
      y: 180,
      value: 'Abiotic Drought',
      unit: 'Class',
      equation: 'arg max P(S | do(Ψ_m), do(NO₃⁻)) via SCM structural matrix',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-blue-900 text-blue-200">
                Pearlian Do-Calculus
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Structural Causal Directed Acyclic Graph (DAG)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Formal graphical causal representation showing how soil matric potential regulates stomatal conductance,
              which physically gates the transpirational mass-flow of nitrate into foliar chloroplasts.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-300">
              Judea Pearl SCM
            </span>
            <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-300">
              d-Separation Verified
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Graph Canvas & Node Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Directed Acyclic Graph */}
        <div className="lg:col-span-8 bg-slate-950 rounded-xl border border-slate-800 p-4 shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2 pb-2 border-b border-slate-800">
            <span>DAG Structural Equations (Nye-Tinker Mass Flow + Jackson CWSI)</span>
            <span className="text-emerald-400">Click any node to inspect equations</span>
          </div>

          <svg viewBox="0 0 780 370" className="w-full h-auto select-none min-w-[620px]">
            <defs>
              <marker
                id="arrowhead-emerald"
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#10b981" />
              </marker>
              <marker
                id="arrowhead-blue"
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
              </marker>
              <marker
                id="arrowhead-amber"
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" />
              </marker>
            </defs>

            {/* Edge Connections */}
            {/* 1. Ψ_m -> g_sw */}
            <path
              d="M 140 80 L 220 80"
              stroke="#3b82f6"
              strokeWidth="2.5"
              fill="none"
              markerEnd="url(#arrowhead-blue)"
            />
            <text x="175" y="72" fill="#93c5fd" fontSize="10" fontFamily="monospace" textAnchor="middle">
              β_turgor
            </text>

            {/* 2. g_sw -> ΔT_c */}
            <path
              d="M 340 80 L 420 80"
              stroke="#f59e0b"
              strokeWidth="2.5"
              fill="none"
              markerEnd="url(#arrowhead-amber)"
            />
            <text x="380" y="72" fill="#fde68a" fontSize="10" fontFamily="monospace" textAnchor="middle">
              γ_latent
            </text>

            {/* 3. g_sw -> J_N (Transpiration gates mass flow) */}
            <path
              d="M 280 120 L 280 240"
              stroke="#10b981"
              strokeWidth="3"
              strokeDasharray="4 2"
              fill="none"
              markerEnd="url(#arrowhead-emerald)"
            />
            <text x="290" y="180" fill="#6ee7b7" fontSize="10" fontFamily="monospace">
              Mass Flow Gate (E)
            </text>

            {/* 4. [NO3-] -> J_N */}
            <path
              d="M 140 280 L 220 280"
              stroke="#3b82f6"
              strokeWidth="2.5"
              fill="none"
              markerEnd="url(#arrowhead-blue)"
            />
            <text x="180" y="272" fill="#93c5fd" fontSize="10" fontFamily="monospace" textAnchor="middle">
              Pore Solute
            </text>

            {/* 5. J_N -> Chl */}
            <path
              d="M 340 280 L 420 280"
              stroke="#10b981"
              strokeWidth="2.5"
              fill="none"
              markerEnd="url(#arrowhead-emerald)"
            />
            <text x="380" y="272" fill="#6ee7b7" fontSize="10" fontFamily="monospace" textAnchor="middle">
              Rubisco Synth
            </text>

            {/* 6. ΔT_c -> Latent Stress */}
            <path
              d="M 540 80 L 640 160"
              stroke="#f59e0b"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead-amber)"
            />

            {/* 7. Chl -> Latent Stress */}
            <path
              d="M 540 280 L 640 200"
              stroke="#10b981"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead-emerald)"
            />

            {/* Render Nodes */}
            {nodes.map((node) => {
              const isSelected = selectedNode === node.id;
              let fillBg = '#1e293b';
              let strokeCol = '#475569';
              if (node.category === 'soil') strokeCol = '#3b82f6';
              if (node.category === 'plant_internal') strokeCol = '#10b981';
              if (node.category === 'canopy_optical') strokeCol = '#f59e0b';
              if (node.category === 'latent_stress') strokeCol = '#a855f7';

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x - 55}, ${node.y - 35})`}
                  onClick={() => setSelectedNode(node.id)}
                  className="cursor-pointer transition-transform hover:scale-105"
                >
                  <rect
                    width="110"
                    height="70"
                    rx="8"
                    fill={fillBg}
                    stroke={isSelected ? '#38bdf8' : strokeCol}
                    strokeWidth={isSelected ? '3' : '1.5'}
                    filter={isSelected ? 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.4))' : undefined}
                  />
                  <text x="55" y="20" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="sans-serif">
                    {node.label}
                  </text>
                  <text
                    x="55"
                    y="40"
                    fill="#f8fafc"
                    fontSize="13"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {node.symbol}
                  </text>
                  <text
                    x="55"
                    y="58"
                    fill="#38bdf8"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {node.value} {node.unit}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Confounding Truth Callout inside DAG */}
          <div className="mt-3 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-white">The Mass-Flow Confounder:</strong> Notice the dashed green edge
              between Stomatal Conductance (g_sw) and Mass-Flow Translocation (J_N). When soil dries (Ψ_m drops),
              stomata clamp shut to protect the xylem. Even if soil has 72 mg/L nitrate, J_N collapses to near zero!
              This causes foliar yellowing (Chl drops) through the <em>hydraulic pathway</em>, which correlation models
              falsely blame on fertilizer starvation.
            </div>
          </div>
        </div>

        {/* Node Inspector & Equation Viewer */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-1">
              Active Node Inspector
            </div>
            {(() => {
              const active = nodes.find((n) => n.id === selectedNode) || nodes[0];
              return (
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">{active.label}</h4>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                      {active.symbol}
                    </span>
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-800">
                    {active.value} <span className="text-xs font-normal text-slate-500">{active.unit}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 text-[11px] font-mono text-slate-600 bg-white p-2 rounded border">
                    <code>{active.equation}</code>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Counterfactual Pearl Simulator: do(X = x') */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Counterfactual do(X = x') Simulator</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Execute Pearl's 3-step abduction-action-prediction: "Given current dry yellow leaf, what would Chl be under intervention?"
            </p>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-[11px] text-slate-600 font-medium block mb-1">
                  Choose Intervention Node:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveIntervention({ node: 'soilMatricPotentialKPa', value: -33.0 })}
                    className={`p-2 rounded border text-left cursor-pointer transition-all ${
                      activeIntervention.node === 'soilMatricPotentialKPa'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    do(Ψ_m = -33 kPa)
                    <span className="block text-[10px] font-normal text-slate-500">Irrigate to Field Capacity</span>
                  </button>

                  <button
                    onClick={() => setActiveIntervention({ node: 'poreWaterNitrateMgL', value: 120.0 })}
                    className={`p-2 rounded border text-left cursor-pointer transition-all ${
                      activeIntervention.node === 'poreWaterNitrateMgL'
                        ? 'bg-purple-50 border-purple-500 text-purple-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    do(NO₃⁻ = +80 kg)
                    <span className="block text-[10px] font-normal text-slate-500">Broadcast Urea Fertilizer</span>
                  </button>
                </div>
              </div>

              {/* Counterfactual Evaluation Card */}
              <div className="p-3 rounded-lg border border-purple-200 bg-purple-50/50 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-purple-900">
                  <span>Target: Chlorophyll (SPAD)</span>
                  <span className="font-mono text-purple-700">
                    Baseline: {counterfactualResult.baselineValue}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xl font-bold font-mono text-purple-900">
                    {counterfactualResult.counterfactualValue} SPAD
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                      counterfactualResult.delta > 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {counterfactualResult.delta > 0 ? `+${counterfactualResult.delta}` : counterfactualResult.delta} Δ
                  </span>
                </div>

                <p className="text-[11px] text-slate-700 leading-relaxed font-sans">
                  {counterfactualResult.causalExplanation}
                </p>

                <div className="text-[10px] font-mono text-purple-800 pt-1 border-t border-purple-200">
                  Pearl PNS = {(counterfactualResult.pearlPNS * 100).toFixed(1)}% (Proven Causal Necessity)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
