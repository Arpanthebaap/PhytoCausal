import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Flame,
  Sun,
  Activity,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { BioKineticGovernor } from '../core/physics_governor';

export const FvCBKineticViewer: React.FC = () => {
  const [leafTemp, setLeafTemp] = useState<number>(26.0);
  const [ciPpm, setCiPpm] = useState<number>(270.0);
  const [parUmols, setParUmols] = useState<number>(1200.0);
  const [stomatalConductance, setStomatalConductance] = useState<number>(0.22);
  const [reportedAn, setReportedAn] = useState<number>(15.5);

  const governor = useMemo(() => new BioKineticGovernor(), []);

  // Compute live point evaluation
  const evalResult = useMemo(() => {
    return governor.evaluateEnvelope(leafTemp, ciPpm, parUmols, stomatalConductance, reportedAn);
  }, [governor, leafTemp, ciPpm, parUmols, stomatalConductance, reportedAn]);

  // Generate curves for SVG rendering
  const ciCurve = useMemo(() => {
    return governor.generateCiCurve(leafTemp, parUmols);
  }, [governor, leafTemp, parUmols]);

  const tempCurve = useMemo(() => {
    return governor.generateTemperatureCurve(ciPpm, parUmols);
  }, [governor, ciPpm, parUmols]);

  // SVG Chart Scales
  // Ci: 0 to 850 ppm -> x: 40 to 520
  // Anet: 0 to 35 umol/m2/s -> y: 220 to 20
  const scaleX = (ci: number) => 40 + (ci / 850) * 480;
  const scaleY = (a: number) => 220 - (Math.max(0, a) / 35) * 200;

  // Path generator
  const acPath = ciCurve.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.ci)} ${scaleY(p.ac)}`).join(' ');
  const ajPath = ciCurve.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.ci)} ${scaleY(p.aj)}`).join(' ');
  const anetPath = ciCurve.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.ci)} ${scaleY(p.anet)}`).join(' ');

  // Current operating point coordinates
  const currentOpX = scaleX(ciPpm);
  const currentOpY = scaleY(evalResult.kineticCeiling);
  const reportedY = scaleY(reportedAn);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400">
                Farquhar-von Caemmerer-Berry (FvCB)
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Biophysical Kinetic Governor & Hallucination Firewall
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Enforces biochemical transport equations and closed-form Arrhenius enzyme thermodynamics
              directly into edge execution. Automatically rejects physically impossible crop diagnostic claims.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1 rounded bg-slate-900 text-emerald-400 font-bold border border-emerald-500/40">
              {evalResult.proofHash}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Curve & Physics Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Farquhar Assimilation vs Ci Curve */}
        <div className="lg:col-span-8 bg-slate-950 rounded-xl border border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-3">
            <span className="text-slate-200 font-semibold">
              Net Photosynthetic Assimilation (A) vs Intercellular CO₂ (C_i)
            </span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2.5 h-0.5 bg-blue-400" /> Rubisco Limit (A_c)
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-0.5 bg-amber-400" /> Light/RuBP Limit (A_j)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-3 h-1 bg-emerald-400" /> Physical Ceiling (A_net)
              </span>
            </div>
          </div>

          {/* SVG Plot */}
          <div className="relative overflow-x-auto">
            <svg viewBox="0 0 580 260" className="w-full h-auto min-w-[500px]">
              {/* Grid Lines */}
              {[0, 10, 20, 30].map((val) => (
                <g key={`y-${val}`}>
                  <line x1="40" y1={scaleY(val)} x2="540" y2={scaleY(val)} stroke="#334155" strokeDasharray="3 3" />
                  <text x="32" y={scaleY(val) + 4} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
                    {val}
                  </text>
                </g>
              ))}

              {[200, 400, 600, 800].map((val) => (
                <g key={`x-${val}`}>
                  <line x1={scaleX(val)} y1="20" x2={scaleX(val)} y2="220" stroke="#334155" strokeDasharray="3 3" />
                  <text x={scaleX(val)} y="235" fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">
                    {val}
                  </text>
                </g>
              ))}

              {/* Axis Labels */}
              <text x="290" y="252" fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="sans-serif">
                Intercellular CO₂ Concentration (C_i in ppm / μmol mol⁻¹)
              </text>
              <text
                x="-120"
                y="14"
                transform="rotate(-90)"
                fill="#94a3b8"
                fontSize="10"
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                A (μmol CO₂ m⁻² s⁻¹)
              </text>

              {/* Curves */}
              <path d={acPath} fill="none" stroke="#60a5fa" strokeWidth="1.8" strokeDasharray="4 2" />
              <path d={ajPath} fill="none" stroke="#fbbf24" strokeWidth="1.8" strokeDasharray="4 2" />
              <path d={anetPath} fill="none" stroke="#10b981" strokeWidth="3" />

              {/* Operating Point on Ceiling */}
              <circle cx={currentOpX} cy={currentOpY} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
              <line x1={currentOpX} y1="20" x2={currentOpX} y2="220" stroke="#10b981" strokeWidth="1" strokeDasharray="2 2" />

              {/* Reported Candidate Point */}
              <circle
                cx={currentOpX}
                cy={reportedY}
                r="6"
                fill={evalResult.isPhysicallyPlausible ? '#3b82f6' : '#ef4444'}
                stroke="#ffffff"
                strokeWidth="2"
              />

              {/* Annotation */}
              <text
                x={currentOpX + 8}
                y={reportedY - 6}
                fill={evalResult.isPhysicallyPlausible ? '#93c5fd' : '#fca5a5'}
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                Reported: {reportedAn} μmol
              </text>

              <text
                x={currentOpX + 8}
                y={currentOpY + 14}
                fill="#6ee7b7"
                fontSize="9"
                fontFamily="monospace"
              >
                Max Ceiling: {evalResult.kineticCeiling} μmol
              </text>
            </svg>
          </div>

          {/* Real-time Invariant Enforcement Callout */}
          <div
            className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${
              evalResult.isPhysicallyPlausible
                ? 'bg-emerald-950/60 border-emerald-600/40 text-emerald-200'
                : 'bg-red-950/70 border-red-500/60 text-red-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {evalResult.isPhysicallyPlausible ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
              )}
              <div>
                <span className="font-bold font-mono">
                  {evalResult.isPhysicallyPlausible ? 'THERMODYNAMIC PROOF PASSED' : 'UNPHYSICAL CLAIM DETECTED & OVERRIDDEN'}
                </span>
                <p className="text-[11px] text-slate-300">
                  {evalResult.isPhysicallyPlausible
                    ? `Candidate assimilation rate (${reportedAn} μmol) complies with kinetic ceiling (${evalResult.kineticCeiling} μmol).`
                    : `VIOLATION: Reported rate (${reportedAn} μmol) exceeds the biochemical Rubisco ceiling (${evalResult.kineticCeiling} μmol) by +${evalResult.violationDelta} μmol. Automatically clamped.`}
                </p>
              </div>
            </div>

            <span className="font-mono text-xs px-2.5 py-1 rounded bg-black/40 border border-slate-700">
              Proof: {evalResult.proofHash}
            </span>
          </div>
        </div>

        {/* Physics Sliders & Dynamic Parameter Modulator */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Enzyme Kinetic Controls</h3>
            </div>
            <button
              onClick={() => {
                setLeafTemp(26.0);
                setCiPpm(270.0);
                setParUmols(1200.0);
                setReportedAn(15.5);
              }}
              className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* 1. Leaf Temperature Slider */}
            <div>
              <div className="flex justify-between text-slate-700 font-medium mb-1">
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  Leaf Temp (T_leaf):
                </span>
                <span className="font-mono font-bold text-slate-900">{leafTemp}°C</span>
              </div>
              <input
                type="range"
                min="10"
                max="44"
                step="0.5"
                value={leafTemp}
                onChange={(e) => setLeafTemp(parseFloat(e.target.value))}
                className="w-full accent-amber-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Arrhenius scaling: Peak optimum at ~28°C; steep decline &gt;36°C
              </span>
            </div>

            {/* 2. Internal CO2 Slider */}
            <div>
              <div className="flex justify-between text-slate-700 font-medium mb-1">
                <span>Intercellular CO₂ (C_i):</span>
                <span className="font-mono font-bold text-slate-900">{ciPpm} ppm</span>
              </div>
              <input
                type="range"
                min="50"
                max="750"
                step="10"
                value={ciPpm}
                onChange={(e) => setCiPpm(parseFloat(e.target.value))}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Regulated by stomatal conductance g_sw
              </span>
            </div>

            {/* 3. PAR Light Flux Slider */}
            <div>
              <div className="flex justify-between text-slate-700 font-medium mb-1">
                <span className="flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  Solar PAR Flux:
                </span>
                <span className="font-mono font-bold text-slate-900">{parUmols} μmol</span>
              </div>
              <input
                type="range"
                min="100"
                max="2200"
                step="50"
                value={parUmols}
                onChange={(e) => setParUmols(parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Controls electron transport rate J
              </span>
            </div>

            {/* 4. Candidate Reported An (Test Hallucination Firewall) */}
            <div className="p-3 rounded-lg border border-slate-300 bg-slate-50">
              <div className="flex justify-between text-slate-800 font-semibold mb-1">
                <span>Candidate An (LLM Hypothesis):</span>
                <span className="font-mono font-bold text-blue-600">{reportedAn} μmol</span>
              </div>
              <input
                type="range"
                min="0"
                max="35"
                step="0.5"
                value={reportedAn}
                onChange={(e) => setReportedAn(parseFloat(e.target.value))}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between items-center mt-2">
                <button
                  onClick={() => setReportedAn(28.5)}
                  className="px-2 py-0.5 rounded text-[10px] bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 cursor-pointer"
                >
                  Inject Impossible Claim (28.5 μmol)
                </button>
                <button
                  onClick={() => setReportedAn(evalResult.kineticCeiling * 0.9)}
                  className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-300 hover:bg-emerald-200 cursor-pointer"
                >
                  Set Valid Rate
                </button>
              </div>
            </div>

            {/* Temperature Profile Preview Mini Table */}
            <div className="border-t border-slate-200 pt-3 text-[11px] font-mono">
              <div className="text-slate-500 font-semibold mb-1.5">
                Arrhenius Parameter State:
              </div>
              <div className="space-y-1 text-slate-700">
                <div className="flex justify-between">
                  <span>Rubisco Limit (A_c):</span>
                  <span className="font-bold">{evalResult.carboxylationLimitAc} μmol m⁻² s⁻¹</span>
                </div>
                <div className="flex justify-between">
                  <span>Light Limit (A_j):</span>
                  <span className="font-bold">{evalResult.electronTransportLimitAj} μmol m⁻² s⁻¹</span>
                </div>
                <div className="flex justify-between">
                  <span>Day Respiration (R_d):</span>
                  <span className="font-bold">1.54 μmol m⁻² s⁻¹</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 text-emerald-700 font-bold">
                  <span>Kinetic Envelope Ceiling:</span>
                  <span>{evalResult.kineticCeiling} μmol m⁻² s⁻¹</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
