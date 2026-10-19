/**
 * PhytoCausal: Core Types & Interfaces
 * Model Context Protocol (MCP v2025-11-25) & Biophysical Causal Engine
 */

// --- MCP v2025-11-25 Protocol Types ---

export interface JSONRPCRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface MCPResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface MCPPromptDefinition {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
}

// --- Biophysical & Subsurface Soil Telemetry Types ---

export interface SoilTelemetry {
  timestamp: string;
  soilMatricPotentialKPa: number; // Ψ_m (matric potential, e.g. -33 kPa field capacity, -1500 kPa permanent wilting point)
  volumetricWaterContent: number; // VWC (m3/m3, e.g. 0.12 - 0.38)
  bulkElectricalConductivity: number; // EC_b (dS/m)
  poreWaterConductivity: number; // EC_p (dS/m via Hilhorst relation)
  soilTemperatureC: number;
  poreWaterNitrateMgL: number; // [NO3-] dissolved in soil solution
  soilDepthCm: number;
  soilTextureClass: 'sandy_loam' | 'silt_loam' | 'clay' | 'loam';
  rawVectorEmbedding?: number[]; // 16-d quantized telemetry embedding
}

// --- Foliar Computer Vision & Radiometry Traits Types ---

export interface CanopyTraits {
  timestamp: string;
  chlorophyllIndexSPAD: number; // 0 - 65 SPAD proxy
  anthocyaninIndex: number; // 0.0 - 1.0 (stress pigment proxy)
  canopyTempC: number;
  ambientTempC: number;
  canopyTempDeltaC: number; // ΔTc = Tcanopy - Tambient (-4°C transpirational cooling to +6°C heat stress)
  stomatalConductanceProxy: number; // g_sw proxy in mol H2O m-2 s-1 (0.02 closed to 0.45 fully open)
  leafCurlingRatio: number; // 0.0 flat to 1.0 tight roll
  excessGreenIndex: number; // ExG = 2G - R - B
  normalizedDiffGreenRed: number; // NDGRI
  internalCO2Ppm: number; // Ci (ppm / μmol mol-1)
  photosyntheticallyActiveRadiation: number; // PAR (μmol photons m-2 s-1)
}

// --- Farquhar-von Caemmerer-Berry (FvCB) Physics Governor Types ---

export interface FvCBConstants {
  vcmax25: number; // Maximum carboxylation velocity at 25°C (μmol m-2 s-1)
  jmax25: number; // Maximum electron transport rate at 25°C (μmol m-2 s-1)
  rd25: number; // Day respiration rate at 25°C (μmol m-2 s-1)
  kc25: number; // Michaelis-Menten constant for CO2 at 25°C (μbar)
  ko25: number; // Michaelis-Menten constant for O2 at 25°C (mbar)
  gammaStar25: number; // CO2 compensation point without dark respiration at 25°C (μbar)
  tpu: number; // Triose-phosphate utilization rate (μmol m-2 s-1)
  eaVc: number; // Activation energy for Vcmax (J mol-1)
  eaJ: number; // Activation energy for Jmax (J mol-1)
  eaRd: number; // Activation energy for Rd (J mol-1)
}

export interface FvCBGovernorOutput {
  reportedPhotosynthesis: number; // Reported A_net (μmol m-2 s-1)
  carboxylationLimitAc: number; // Rubisco limited Ac
  electronTransportLimitAj: number; // Light limited Aj
  tpuLimitAp: number; // TPU limited Ap
  kineticCeiling: number; // min(Ac, Aj, Ap) - Rd
  transpirationRateE: number; // mmol m-2 s-1
  waterUseEfficiency: number; // A / E (μmol CO2 / mmol H2O)
  isPhysicallyPlausible: boolean;
  proofHash: string; // Cryptographic boundary receipt, e.g. "0xPHYTO-PASS-74B9"
  status: 'PHYSICALLY_COMPLIANT' | 'OVERRIDE_TRIGGERED_UNPHYSICAL';
  violationDelta: number; // Positive if violated
}

// --- Structural Causal Model (SCM) & Counterfactual Types ---

export type PrimaryStressType =
  | 'ABIOTIC_WATER_STRESS'
  | 'NUTRITIONAL_NITROGEN_DEFICIENCY'
  | 'SALINITY_OSMOTIC_LOCK'
  | 'COMPOUND_WATER_NITROGEN_STRESS'
  | 'HOMEOSTATIC_HEALTHY';

export interface CausalDisambiguationResult {
  primaryDriver: PrimaryStressType;
  confidenceScore: number; // 0.0 - 1.0
  counterfactualSufficiency: number; // PNS: Probability of Necessity & Sufficiency
  droughtStressIndex: number; // 0.0 - 1.0
  nitrogenDeficitIndex: number; // 0.0 - 1.0
  salinityOsmoticIndex: number; // 0.0 - 1.0
  thermalStressIndex: number; // 0.0 - 1.0
  rootMassFlowFlux: number; // Nitrogen uptake flux (mg N m-2 d-1)
  isTranspirationDecoupled: boolean; // True if chlorosis is purely caused by hydraulic halt
  recommendedAction: {
    urgentCode: 'IRRIGATE_RESTORE_MASSFLOW' | 'APPLY_NITROGEN_FERTILIZER' | 'LEACH_SALINITY' | 'HOLD_ALL_INPUTS' | 'STAGGERED_HYDRATION_THEN_N';
    title: string;
    rationale: string;
    forbiddenAction: string; // The common mistake naive correlation AI makes
    counterfactualBenefit: string;
  };
  nodeAttributions: Record<string, number>;
}

export interface CounterfactualQuery {
  targetVariable: 'chlorophyllIndexSPAD' | 'canopyTempDeltaC' | 'rootMassFlowFlux';
  interventionNode: 'soilMatricPotentialKPa' | 'poreWaterNitrateMgL' | 'stomatalConductanceProxy';
  interventionValue: number;
}

export interface CounterfactualResult {
  query: CounterfactualQuery;
  baselineValue: number;
  counterfactualValue: number;
  delta: number;
  causalExplanation: string;
  pearlPNS: number;
}

// --- Field Benchmark & Case Study Types ---

export interface FieldCaseStudy {
  id: string;
  cropName: string;
  variety: string;
  location: string;
  latitude: number;
  longitude: number;
  climateZone: string;
  fieldDescription: string;
  naiveCorrelationPrediction: {
    diagnosis: string;
    action: string;
    catastrophicOutcome: string;
  };
  telemetry: SoilTelemetry;
  traits: CanopyTraits;
}

// --- Edge Hardware Budget & Resource Router Types ---

export interface EdgeResourceProfile {
  targetDevice: 'Raspberry Pi 4 (Cortex-A72)' | 'ESP32-S3 (Xtensa LX7)' | 'Pixel Edge TPU / Smartphone' | 'Local Laptop x86-64';
  ramUsageMB: number;
  maxRamBudgetMB: number;
  inferenceLatencyMs: number;
  powerConsumptionWatts: number;
  quantizationMode: 'INT8 Quantized' | 'FP16 ONNX' | 'Analytical SCM Float32';
  zeroCloudEnforced: boolean;
  status: 'OPTIMAL_EDGE_COMPLIANT' | 'BUDGET_EXCEEDED';
}

// --- AI Multimodal Causal Copilot Types ---

export interface AIDiagnosisResult {
  engine: 'Gemini-3.8-Flash Causal Reasoner' | 'Edge-Compiled Deterministic SCM';
  timestamp: string;
  isOnlineAI: boolean;
  biochemicalMechanism: string;
  confoundingDecouplingExplanation: string;
  prescriptions: {
    irrigationMm: number;
    nitrogenKgHa: number;
    timing: string;
    applicationMethod: string;
    forbiddenAction: string;
  };
  counterfactualSimulations: Array<{
    intervention: string;
    outcome: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    yieldImpactPercent: number;
  }>;
  safetyInvariantCheck: {
    status: 'PASSED' | 'FAILED';
    hash: string;
    notes: string;
  };
  variableRatePrescriptionJson: string;
}
