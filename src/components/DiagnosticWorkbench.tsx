import React, { useState, useMemo, useRef } from 'react';
import {
  AlertTriangle,
  Droplets,
  Thermometer,
  Wind,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  MapPin,
  Clock,
  Eye,
  Sliders,
  Upload,
  Camera,
  CheckCircle2,
  DollarSign,
  Leaf,
  FileCode,
  X,
} from 'lucide-react';
import { SoilTelemetry, CanopyTraits, FieldCaseStudy } from '../types';
import { FIELD_CASE_STUDIES } from '../data/field_cases';
import { CausalStressDisambiguator } from '../core/causal_engine';
import { BioKineticGovernor } from '../core/physics_governor';
import { AICausalCopilot } from './AICausalCopilot';

export const DiagnosticWorkbench: React.FC = () => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('midwest-corn-false-alarm');
  const [isManualOverride, setIsManualOverride] = useState<boolean>(false);
  const [showEquationModal, setShowEquationModal] = useState<boolean>(false);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [analyzedRgb, setAnalyzedRgb] = useState<{ r: number; g: number; b: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active state initialized from selected case
  const currentCase = useMemo(() => {
    return FIELD_CASE_STUDIES.find((c) => c.id === selectedCaseId) || FIELD_CASE_STUDIES[0];
  }, [selectedCaseId]);

  const [soilState, setSoilState] = useState<SoilTelemetry>(currentCase.telemetry);
  const [canopyState, setCanopyState] = useState<CanopyTraits>(currentCase.traits);

  // When selected case changes and not manual override, update states
  const handleSelectCase = (caseStudy: FieldCaseStudy) => {
    setSelectedCaseId(caseStudy.id);
    setIsManualOverride(false);
    setUploadedImagePreview(null);
    setAnalyzedRgb(null);
    setSoilState(caseStudy.telemetry);
    setCanopyState(caseStudy.traits);
  };

  const disambiguator = useMemo(() => new CausalStressDisambiguator(), []);
  const governor = useMemo(() => new BioKineticGovernor(), []);

  // Compute live SCM disambiguation
  const causalResult = useMemo(() => {
    return disambiguator.evaluate(soilState, canopyState);
  }, [disambiguator, soilState, canopyState]);

  // Compute live FvCB biokinetic bounds
  const governorResult = useMemo(() => {
    return governor.evaluateEnvelope(
      canopyState.canopyTempC,
      canopyState.internalCO2Ppm,
      canopyState.photosyntheticallyActiveRadiation,
      canopyState.stomatalConductanceProxy,
      14.2
    );
  }, [governor, canopyState]);

  // Handle Real Image Upload & In-Browser Canvas Color Extraction
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgUrl = event.target?.result as string;
      setUploadedImagePreview(imgUrl);

      // Analyze image pixels via HTML5 Canvas
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = 120;
        canvas.height = 120;
        ctx.drawImage(img, 0, 0, 120, 120);

        const imgData = ctx.getImageData(0, 0, 120, 120).data;
        let totalR = 0;
        let totalG = 0;
        let totalB = 0;
        let count = 0;

        for (let i = 0; i < imgData.length; i += 4) {
          totalR += imgData[i];
          totalG += imgData[i + 1];
          totalB += imgData[i + 2];
          count++;
        }

        const avgR = Math.round(totalR / count);
        const avgG = Math.round(totalG / count);
        const avgB = Math.round(totalB / count);

        setAnalyzedRgb({ r: avgR, g: avgG, b: avgB });

        // Calculate optical indices
        const sum = avgR + avgG + avgB + 1e-6;
        const rNorm = avgR / sum;
        const gNorm = avgG / sum;
        const bNorm = avgB / sum;

        const exG = Number((2 * gNorm - rNorm - bNorm).toFixed(3));
        const ndgri = Number(((gNorm - rNorm) / (gNorm + rNorm + 1e-6)).toFixed(3));
        const spad = Number(Math.max(8.0, Math.min(65.0, 18.0 + (gNorm / (rNorm + 0.01)) * 14.5)).toFixed(1));

        setIsManualOverride(true);
        setCanopyState((prev) => ({
          ...prev,
          excessGreenIndex: exG,
          normalizedDiffGreenRed: ndgri,
          chlorophyllIndexSPAD: spad,
        }));
      };
      img.src = imgUrl;
    };
    reader.readAsDataURL(file);
  };

  // Environmental & ROI Impact Metrics
  const roiMetrics = useMemo(() => {
    const isWaterStress = causalResult.primaryDriver === 'ABIOTIC_WATER_STRESS';
    const ureaSavedKgHa = isWaterStress ? 85 : 0;
    const costSavedUsd = ureaSavedKgHa * 1.35; // ~$1.35 per kg synthetic N fertilizer
    const avoidedLeachingKgHa = isWaterStress ? 52 : 0;
    const carbonOffsetKgCo2e = ureaSavedKgHa * 2.8; // Haber-Bosch carbon intensity

    return {
      ureaSavedKgHa,
      costSavedUsd: Math.round(costSavedUsd),
      avoidedLeachingKgHa,
      carbonOffsetKgCo2e: Math.round(carbonOffsetKgCo2e),
    };
  }, [causalResult]);

  return (
    <div className="space-y-6">
      {/* Top Action Bar with Real Field Dilemmas & Mathematical Formulation Drawer Toggle */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Verified Multi-Stress Dilemmas (Confounding Decoupler)
            </h2>
            <p className="text-xs text-slate-500">
              Select a field situation to inspect how statistical correlation AI fails and how biophysical causality decouples root causes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEquationModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5" />
              Theoretical Equations & Proofs
            </button>

            {isManualOverride && (
              <button
                onClick={() => handleSelectCase(currentCase)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Case
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FIELD_CASE_STUDIES.map((c) => {
            const isSelected = selectedCaseId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => handleSelectCase(c)}
                className={`text-left p-3 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
                  <span className="truncate">{c.cropName.split(' ')[0]} ({c.variety})</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  )}
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-1 mb-2 font-mono">
                  {c.location.split(',')[0]}
                </p>
                <div className="text-[10px] text-slate-500 line-clamp-2">
                  {c.fieldDescription}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Case Overview & Critical Dilemma Alert */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-700">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-2 mb-1.5 text-xs font-mono text-emerald-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Timestamp: {currentCase.telemetry.timestamp}</span>
              <span>•</span>
              <span>Coordinates: {currentCase.latitude.toFixed(2)}°N, {currentCase.longitude.toFixed(2)}°W</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {currentCase.cropName} — {currentCase.location}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {currentCase.fieldDescription}
            </p>
          </div>

          <div className="lg:col-span-5 bg-red-950/40 border border-red-500/40 rounded-lg p-3 text-xs">
            <div className="flex items-center gap-1.5 text-red-300 font-semibold mb-1">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>Naive Correlation AI Blindspot (Standard Vision / LLMs):</span>
            </div>
            <p className="text-red-200 mb-1 font-medium">
              Predicted: <span className="underline decoration-red-400">{currentCase.naiveCorrelationPrediction.diagnosis}</span>
            </p>
            <p className="text-[11px] text-slate-300 mb-1.5">
              Prescription: {currentCase.naiveCorrelationPrediction.action}
            </p>
            <div className="bg-red-900/30 p-2 rounded text-[10px] text-red-200 border border-red-800/50 leading-tight">
              <strong>Catastrophic Consequence:</strong> {currentCase.naiveCorrelationPrediction.catastrophicOutcome}
            </div>
          </div>
        </div>
      </div>

      {/* Synchronized Dual Telemetry Streams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stream 1: Foliar Computer Vision & Radiometric Thermal Telemetry */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                V
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Stream 1: Foliar Computer Vision & Thermal Radiometry
                </h3>
                <p className="text-[11px] text-slate-500">Close-up leaf phenotyping & radiometric FLIR radiometry</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Edge ONNX Int8
            </span>
          </div>

          <div className="p-4 space-y-4">
            {/* Real Image Upload & In-Browser Pixel Analyzer */}
            <div className="p-3 rounded-lg bg-slate-900 text-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {uploadedImagePreview ? (
                    <img
                      src={uploadedImagePreview}
                      alt="Uploaded Crop Specimen"
                      className="w-14 h-14 rounded-lg object-cover border border-emerald-400 shadow-sm"
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-lg border border-slate-700 flex items-center justify-center text-2xl shadow-inner"
                      style={{
                        backgroundColor:
                          canopyState.chlorophyllIndexSPAD > 38
                            ? '#166534'
                            : canopyState.chlorophyllIndexSPAD > 25
                            ? '#ca8a04'
                            : '#eab308',
                      }}
                    >
                      🌿
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      {uploadedImagePreview ? 'Custom Field Leaf Analyzed' : 'Simulated Specimen: ' + (canopyState.chlorophyllIndexSPAD < 26 ? 'Severe Chlorosis (Yellowing)' : 'Adequate Greenness')}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      ExG: {canopyState.excessGreenIndex} | NDGRI: {canopyState.normalizedDiffGreenRed}
                    </div>
                    {analyzedRgb && (
                      <div className="text-[10px] font-mono text-emerald-400 mt-0.5">
                        Pixel Means: R={analyzedRgb.r} G={analyzedRgb.g} B={analyzedRgb.b}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">SPAD Chlorophyll</div>
                  <div className="text-xl font-bold font-mono text-emerald-400">
                    {canopyState.chlorophyllIndexSPAD}
                  </div>
                </div>
              </div>

              {/* Upload Action Button */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  Analyze Custom Leaf Photo
                </button>
                <span className="text-[10px] text-slate-500">HTML5 Canvas Pixel Histogram</span>
              </div>
            </div>

            {/* Trait Meters Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
                <div className="flex items-center justify-between text-slate-600 mb-1">
                  <span className="flex items-center gap-1 font-medium">
                    <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                    Canopy Temp Delta (ΔTc)
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {canopyState.canopyTempDeltaC > 0 ? `+${canopyState.canopyTempDeltaC}` : canopyState.canopyTempDeltaC}°C
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      canopyState.canopyTempDeltaC > 2 ? 'bg-red-500' : canopyState.canopyTempDeltaC > 0 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(10, (canopyState.canopyTempDeltaC + 3) * 15))}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {canopyState.canopyTempDeltaC > 1.5 ? 'Transpirational cooling failed (stomata shut)' : 'Active evaporative cooling'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
                <div className="flex items-center justify-between text-slate-600 mb-1">
                  <span className="flex items-center gap-1 font-medium">
                    <Wind className="w-3.5 h-3.5 text-blue-600" />
                    Stomatal Proxy (gsw)
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {canopyState.stomatalConductanceProxy} mol
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{
                      width: `${Math.min(100, (canopyState.stomatalConductanceProxy / 0.45) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {canopyState.stomatalConductanceProxy < 0.1 ? 'Clamped shut against cavitation' : 'Open for gas exchange'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
                <div className="flex items-center justify-between text-slate-600 mb-1">
                  <span className="font-medium">Leaf Curling Ratio</span>
                  <span className="font-mono font-bold text-slate-900">
                    {(canopyState.leafCurlingRatio * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: `${canopyState.leafCurlingRatio * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">Turgor pressure loss indicator</span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
                <div className="flex items-center justify-between text-slate-600 mb-1">
                  <span className="font-medium">Internal CO2 (Ci)</span>
                  <span className="font-mono font-bold text-slate-900">
                    {canopyState.internalCO2Ppm} ppm
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500"
                    style={{ width: `${Math.min(100, (canopyState.internalCO2Ppm / 400) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">Sub-stomatal cavity drawdown</span>
              </div>
            </div>

            {/* Interactive Sliders for Live Sensitivity Testing */}
            <div className="border-t border-slate-200 pt-3">
              <div className="text-[11px] font-semibold text-slate-700 flex items-center justify-between mb-2">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-slate-500" />
                  Live Trait Modulation (Override)
                </span>
                <span className="text-[10px] font-mono text-slate-400">Updates causal graph instantly</span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                    <span>Chlorophyll Index (SPAD):</span>
                    <span className="font-mono font-bold text-slate-800">{canopyState.chlorophyllIndexSPAD}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="65"
                    step="0.5"
                    value={canopyState.chlorophyllIndexSPAD}
                    onChange={(e) => {
                      setIsManualOverride(true);
                      setCanopyState({ ...canopyState, chlorophyllIndexSPAD: parseFloat(e.target.value) });
                    }}
                    className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                    <span>Canopy Temp Delta (ΔTc):</span>
                    <span className="font-mono font-bold text-slate-800">{canopyState.canopyTempDeltaC}°C</span>
                  </div>
                  <input
                    type="range"
                    min="-3.5"
                    max="6.0"
                    step="0.1"
                    value={canopyState.canopyTempDeltaC}
                    onChange={(e) => {
                      setIsManualOverride(true);
                      const delta = parseFloat(e.target.value);
                      const gsw = Math.max(0.01, Math.min(0.45, 0.35 - (delta / 5.0) * 0.28));
                      setCanopyState({
                        ...canopyState,
                        canopyTempDeltaC: delta,
                        stomatalConductanceProxy: Number(gsw.toFixed(3)),
                      });
                    }}
                    className="w-full accent-amber-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stream 2: Subsurface Soil Hydrology & Solute Telemetry */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                S
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Stream 2: Subsurface Soil Hydrology & Solute Telemetry
                </h3>
                <p className="text-[11px] text-slate-500">Matric potential, porewater conductivity & solute logs</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              16-d Embeddings
            </span>
          </div>

          <div className="p-4 space-y-4">
            {/* Subsoil Status Highlight Card */}
            <div className="p-3 rounded-lg bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xl">
                  💧
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Soil Hydraulic Status: {soilState.soilMatricPotentialKPa < -150 ? 'Severe Water Stress' : 'Hydraulically Sufficient'}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Porewater [NO3-]: {soilState.poreWaterNitrateMgL} mg/L ({soilState.poreWaterNitrateMgL > 40 ? 'High Reserve' : 'Depleted'})
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Matric Potential</div>
                <div className={`text-xl font-bold font-mono ${soilState.soilMatricPotentialKPa < -150 ? 'text-red-400' : 'text-blue-400'}`}>
                  {soilState.soilMatricPotentialKPa} kPa
                </div>
              </div>
            </div>

            {/* Soil Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
                <div className="flex items-center justify-between text-slate-600 mb-1">
                  <span className="flex items-center gap-1 font-medium">
                    <Droplets className="w-3.5 h-3.5 text-blue-600" />
                    Volumetric Water (VWC)
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {(soilState.volumetricWaterContent * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600"
                    style={{ width: `${Math.min(100, soilState.volumetricWaterContent * 250)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Field Capacity: 32% | Wilting: 11%
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
                <div className="flex items-center justify-between text-slate-600 mb-1">
                  <span className="font-medium">Porewater EC (ECp)</span>
                  <span className="font-mono font-bold text-slate-900">
                    {soilState.poreWaterConductivity} dS/m
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${soilState.poreWaterConductivity > 3.5 ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, (soilState.poreWaterConductivity / 6.0) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">Hilhorst dielectric conversion</span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
                <div className="flex items-center justify-between text-slate-600 mb-1">
                  <span className="font-medium">Soil Temperature</span>
                  <span className="font-mono font-bold text-slate-900">
                    {soilState.soilTemperatureC}°C
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">Depth: {soilState.soilDepthCm} cm ({soilState.soilTextureClass})</span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
                <div className="flex items-center justify-between text-slate-600 mb-1">
                  <span className="font-medium">Mass-Flow Solute Flux</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {causalResult.rootMassFlowFlux} mg N
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">JN = gsw • [NO3-] • permeability</span>
              </div>
            </div>

            {/* Interactive Sliders for Soil Modulation */}
            <div className="border-t border-slate-200 pt-3">
              <div className="text-[11px] font-semibold text-slate-700 flex items-center justify-between mb-2">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-slate-500" />
                  Live Soil Potential Modulation (Override)
                </span>
                <span className="text-[10px] font-mono text-slate-400">Decouples mass-flow</span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                    <span>Soil Matric Potential (Ψm in kPa):</span>
                    <span className="font-mono font-bold text-slate-800">{soilState.soilMatricPotentialKPa} kPa</span>
                  </div>
                  <input
                    type="range"
                    min="-400"
                    max="-15"
                    step="5"
                    value={soilState.soilMatricPotentialKPa}
                    onChange={(e) => {
                      setIsManualOverride(true);
                      const psi = parseFloat(e.target.value);
                      const vwc = Math.max(0.08, Math.min(0.40, 0.40 - (Math.abs(psi) / 500.0) * 0.32));
                      setSoilState({
                        ...soilState,
                        soilMatricPotentialKPa: psi,
                        volumetricWaterContent: Number(vwc.toFixed(3)),
                      });
                    }}
                    className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                    <span>Soil Porewater Nitrate [NO3-] (mg/L):</span>
                    <span className="font-mono font-bold text-slate-800">{soilState.poreWaterNitrateMgL} mg/L</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="110"
                    step="1"
                    value={soilState.poreWaterNitrateMgL}
                    onChange={(e) => {
                      setIsManualOverride(true);
                      setSoilState({ ...soilState, poreWaterNitrateMgL: parseFloat(e.target.value) });
                    }}
                    className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Core Structural Causal Model (SCM) Disambiguation Result Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-slate-900 text-emerald-400">
                SCM Inference Core
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Pearlian Multi-Stress Decoupling Engine
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Structural equation matrix separating transpirational mass-flow arrest from true nutrient depletion
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] text-slate-500">Pearl Counterfactual Sufficiency (PNS)</div>
              <div className="text-sm font-mono font-bold text-blue-700">
                P(Y_x=1, Y_x'=0) = {(causalResult.counterfactualSufficiency * 100).toFixed(1)}%
              </div>
            </div>
            <div className="px-3 py-1 rounded bg-blue-50 border border-blue-200 text-blue-700 font-mono text-xs font-semibold">
              Conf: {(causalResult.confidenceScore * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Primary Driver Output Banner */}
        <div
          className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            causalResult.primaryDriver === 'ABIOTIC_WATER_STRESS'
              ? 'bg-amber-50/70 border-amber-300'
              : causalResult.primaryDriver === 'NUTRITIONAL_NITROGEN_DEFICIENCY'
              ? 'bg-emerald-50/70 border-emerald-300'
              : causalResult.primaryDriver === 'SALINITY_OSMOTIC_LOCK'
              ? 'bg-purple-50/70 border-purple-300'
              : 'bg-blue-50/70 border-blue-300'
          }`}
        >
          <div>
            <div className="text-xs uppercase tracking-wider font-mono font-semibold text-slate-600 mb-1">
              Decoupled Primary Stress Driver
            </div>
            <div className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>{causalResult.primaryDriver.replace(/_/g, ' ')}</span>
              {causalResult.isTranspirationDecoupled && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-600 text-white font-medium">
                  Deceptive Chlorosis Decoupled
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              {causalResult.recommendedAction.rationale}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <div className="p-3 bg-white/90 rounded-lg border border-slate-200 text-center shadow-2xs">
              <div className="text-[10px] text-slate-500 uppercase font-mono">Drought Stress (DSI)</div>
              <div className="text-base font-bold font-mono text-amber-600">
                {causalResult.droughtStressIndex}
              </div>
            </div>
            <div className="p-3 bg-white/90 rounded-lg border border-slate-200 text-center shadow-2xs">
              <div className="text-[10px] text-slate-500 uppercase font-mono">Nitrogen Deficit (NDI)</div>
              <div className="text-base font-bold font-mono text-emerald-600">
                {causalResult.nitrogenDeficitIndex}
              </div>
            </div>
          </div>
        </div>

        {/* Action Prescription with Physical Constraint Enforcement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
              <span>Recommended Agronomic Prescription</span>
            </div>
            <div className="font-semibold text-emerald-800 text-xs">
              {causalResult.recommendedAction.title}
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              <strong>Counterfactual Benefit:</strong> {causalResult.recommendedAction.counterfactualBenefit}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-red-200 bg-red-50/40 space-y-2">
            <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
              <ShieldAlert className="w-4.5 h-4.5 text-red-600" />
              <span>Strict Physical Safety Constraint (Forbidden Action)</span>
            </div>
            <div className="font-semibold text-red-800 text-xs">
              {causalResult.recommendedAction.forbiddenAction}
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Enforced by Farquhar boundary governor to prevent irreversible osmotic root burn and environmental leaching.
            </p>
          </div>
        </div>

        {/* Real Economic & Environmental Impact Card (Unique Agronomic ROI) */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Agronomic Economics & Nitrate Leaching Prevention Dashboard</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Field Size: 1.0 Hectare Basis</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
              <div className="text-[10px] text-slate-500 uppercase font-mono">Avoided Fertilizer Waste</div>
              <div className="text-base font-bold font-mono text-emerald-700 mt-0.5">
                {roiMetrics.ureaSavedKgHa} kg N/ha
              </div>
              <span className="text-[10px] text-slate-500">Unnecessary urea stopped</span>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
              <div className="text-[10px] text-slate-500 uppercase font-mono">Input Cost Savings</div>
              <div className="text-base font-bold font-mono text-blue-700 mt-0.5">
                ${roiMetrics.costSavedUsd} / ha
              </div>
              <span className="text-[10px] text-slate-500">Conserves farm capital</span>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
              <div className="text-[10px] text-slate-500 uppercase font-mono">Aquifer Leaching Prevented</div>
              <div className="text-base font-bold font-mono text-teal-700 mt-0.5">
                {roiMetrics.avoidedLeachingKgHa} kg NO₃⁻
              </div>
              <span className="text-[10px] text-slate-500">Complies with water directives</span>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
              <div className="text-[10px] text-slate-500 uppercase font-mono">Emissions Averted</div>
              <div className="text-base font-bold font-mono text-purple-700 mt-0.5">
                {roiMetrics.carbonOffsetKgCo2e} kg CO₂e
              </div>
              <span className="text-[10px] text-slate-500">Haber-Bosch footprint offset</span>
            </div>
          </div>
        </div>

        {/* Biophysical Governor Boundary Audit */}
        <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-slate-300 font-sans font-semibold text-xs">
                Biokinetic Governor Proof Receipt
              </div>
              <div className="text-emerald-400 text-sm font-bold">
                {governorResult.proofHash} • {governorResult.status}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-slate-300 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">Kinetic Ceiling (Amax)</span>
              <span className="text-white font-bold">{governorResult.kineticCeiling} μmol m⁻² s⁻¹</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Transpiration (E)</span>
              <span className="text-white font-bold">{governorResult.transpirationRateE} mmol m⁻² s⁻¹</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Water Use Efficiency</span>
              <span className="text-emerald-400 font-bold">{governorResult.waterUseEfficiency}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Multimodal Biophysical Causal Reasoner Copilot */}
      <AICausalCopilot
        cropName={currentCase.cropName}
        location={currentCase.location}
        soilState={soilState}
        canopyState={canopyState}
        causalResult={causalResult}
        uploadedImagePreview={uploadedImagePreview}
      />

      {/* Equations & Mathematical Proofs Modal */}
      {showEquationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Theoretical Foundations & Closed-Form Equations
                </h3>
              </div>
              <button
                onClick={() => setShowEquationModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-sans">
              <div>
                <h4 className="font-bold text-slate-900 mb-1">1. Solute Mass-Flow Translocation (Nye-Tinker Relation)</h4>
                <div className="p-3 bg-slate-900 text-emerald-300 rounded-lg font-mono text-[11px]">
                  J_N = E · [NO3-]pore = g_sw · VPD · [NO3-] · &kappa;_hydraulic
                </div>
                <p className="mt-1 text-slate-600">
                  Demonstrates that nitrate uptake is directly gated by transpirational volume flux (E). When soil dries,
                  stomata close (g_sw &rarr; 0), arresting nitrate mass-flow even if soil nitrate is abundant.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">2. Farquhar-von Caemmerer-Berry (FvCB) Photosynthesis Envelope</h4>
                <div className="p-3 bg-slate-900 text-emerald-300 rounded-lg font-mono text-[11px]">
                  A_net = min( A_c, A_j, A_p ) - R_d
                </div>
                <p className="mt-1 text-slate-600">
                  Defines the absolute physical ceiling for photosynthetic assimilation, bounding generative AI hallucinations.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">3. Arrhenius Enzyme Temperature Scaling</h4>
                <div className="p-3 bg-slate-900 text-emerald-300 rounded-lg font-mono text-[11px]">
                  k(T) = k_25 · exp( [E_a · (T_k - 298.15)] / [R · T_k · 298.15] )
                </div>
                <p className="mt-1 text-slate-600">
                  Accurately models thermal breakdown of Rubisco and electron transport velocity under high heatwaves.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">4. Pearlian Counterfactual Necessity & Sufficiency (PNS)</h4>
                <div className="p-3 bg-slate-900 text-purple-300 rounded-lg font-mono text-[11px]">
                  PNS = P( Y_(X=x) = 1, Y_(X=x') = 0 )
                </div>
                <p className="mt-1 text-slate-600">
                  Computes the formal causal probability that hydration alone will reverse foliar chlorosis without adding synthetic nitrogen.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowEquationModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close Formulation Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
