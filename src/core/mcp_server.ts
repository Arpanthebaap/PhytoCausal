/**
 * PhytoCausal: Model Context Protocol (MCP v2025-11-25) Server
 * JSON-RPC 2.0 orchestration node running edge-compiled agroecosystem diagnostics.
 */

import {
  JSONRPCRequest,
  JSONRPCResponse,
  MCPToolDefinition,
  MCPResourceDefinition,
  MCPPromptDefinition,
  SoilTelemetry,
  CanopyTraits,
  CounterfactualQuery,
} from '../types';
import { BioKineticGovernor } from './physics_governor';
import { CausalStressDisambiguator } from './causal_engine';
import { CanopyTraitExtractor } from './canopy_traits';
import { SoilTelemetryParser } from './soil_telemetry';
import { EdgeResourceRouter } from './resource_router';

export class AgriMCPServer {
  private disambiguator: CausalStressDisambiguator;
  private governor: BioKineticGovernor;
  private traitExtractor: CanopyTraitExtractor;
  private soilParser: SoilTelemetryParser;
  private resourceRouter: EdgeResourceRouter;

  constructor() {
    this.disambiguator = new CausalStressDisambiguator();
    this.governor = new BioKineticGovernor();
    this.traitExtractor = new CanopyTraitExtractor();
    this.soilParser = new SoilTelemetryParser();
    this.resourceRouter = new EdgeResourceRouter();
  }

  /**
   * Tool definitions adhering strictly to MCP v2025-11-25 spec
   */
  public getToolDefinitions(): MCPToolDefinition[] {
    return [
      {
        name: 'phytocausal_disambiguate_stress',
        description:
          'Decouple overlapping plant stressors (Nitrogen Deficiency vs Drought vs Salinity) using Pearlian Structural Causal Models and mass-flow transport equations.',
        inputSchema: {
          type: 'object',
          properties: {
            soilTelemetry: {
              type: 'object',
              description: 'Subsurface multi-depth soil probe telemetry record',
            },
            canopyTraits: {
              type: 'object',
              description: 'Foliar optical computer vision and thermal radiometry traits',
            },
          },
          required: ['soilTelemetry', 'canopyTraits'],
        },
      },
      {
        name: 'phytocausal_verify_biokinetics',
        description:
          'Enforce Farquhar-von Caemmerer-Berry (FvCB) photosynthesis boundary invariants and Arrhenius kinetics to prevent AI hallucination.',
        inputSchema: {
          type: 'object',
          properties: {
            leafTempC: { type: 'number', description: 'Canopy leaf temperature in Celsius' },
            ciPpm: { type: 'number', description: 'Intercellular CO2 concentration (ppm)' },
            parUmols: { type: 'number', description: 'Incident PAR flux (μmol photons m-2 s-1)' },
            stomatalConductance: { type: 'number', description: 'Stomatal conductance gsw (mol m-2 s-1)' },
            reportedAn: { type: 'number', description: 'Candidate net photosynthetic rate reported by agent' },
          },
          required: ['leafTempC', 'ciPpm'],
        },
      },
      {
        name: 'phytocausal_counterfactual_do',
        description:
          "Execute Pearl's counterfactual do(X = x') query to assess 'what would have happened' under alternative irrigation or fertilization actions.",
        inputSchema: {
          type: 'object',
          properties: {
            soilTelemetry: { type: 'object' },
            canopyTraits: { type: 'object' },
            query: {
              type: 'object',
              properties: {
                targetVariable: { type: 'string', enum: ['chlorophyllIndexSPAD', 'canopyTempDeltaC', 'rootMassFlowFlux'] },
                interventionNode: { type: 'string', enum: ['soilMatricPotentialKPa', 'poreWaterNitrateMgL', 'stomatalConductanceProxy'] },
                interventionValue: { type: 'number' },
              },
              required: ['targetVariable', 'interventionNode', 'interventionValue'],
            },
          },
          required: ['soilTelemetry', 'canopyTraits', 'query'],
        },
      },
      {
        name: 'phytocausal_extract_canopy_traits',
        description:
          'Extract physiological indices (NDGRI, ExG, Anthocyanin, SPAD proxy, gsw proxy) from close-up leaf imagery and thermal radiometry.',
        inputSchema: {
          type: 'object',
          properties: {
            meanR: { type: 'number' },
            meanG: { type: 'number' },
            meanB: { type: 'number' },
            canopyTempC: { type: 'number' },
            ambientTempC: { type: 'number' },
          },
          required: ['meanR', 'meanG', 'meanB', 'canopyTempC', 'ambientTempC'],
        },
      },
      {
        name: 'phytocausal_parse_soil_telemetry',
        description:
          'Parse asynchronous soil telemetry logs and derive 16-d quantized embeddings and porewater conductivity.',
        inputSchema: {
          type: 'object',
          properties: {
            psiM: { type: 'number', description: 'Matric potential in kPa' },
            vwc: { type: 'number', description: 'Volumetric water content m3/m3' },
            bulkEC: { type: 'number', description: 'Bulk EC in dS/m' },
            nitrateMgL: { type: 'number', description: 'Porewater nitrate in mg/L' },
          },
          required: ['psiM', 'vwc', 'bulkEC', 'nitrateMgL'],
        },
      },
      {
        name: 'phytocausal_audit_edge_budget',
        description:
          'Audit edge device hardware envelope (RAM footprint, execution latency, offline verification) on low-connectivity target hardware.',
        inputSchema: {
          type: 'object',
          properties: {
            targetDevice: {
              type: 'string',
              enum: ['Raspberry Pi 4 (Cortex-A72)', 'ESP32-S3 (Xtensa LX7)', 'Pixel Edge TPU / Smartphone', 'Local Laptop x86-64'],
            },
          },
          required: ['targetDevice'],
        },
      },
    ];
  }

  public getResourceDefinitions(): MCPResourceDefinition[] {
    return [
      {
        uri: 'phytocausal://agronomy/fvcb-c3-constants',
        name: 'Farquhar-von Caemmerer-Berry C3 Parameters',
        description: 'Biophysical constants for C3 photosynthesis kinetics (Rubisco, electron transport, TPU)',
        mimeType: 'application/json',
      },
      {
        uri: 'phytocausal://agronomy/critical-nitrogen-dilution',
        name: 'Justes Critical Nitrogen Dilution Curve',
        description: 'Empirical boundary curve Nc = 4.8 * W^(-0.32) for separating luxury consumption from true deficit',
        mimeType: 'application/json',
      },
      {
        uri: 'phytocausal://soil/van-genuchten-curves',
        name: 'van Genuchten Soil Water Retention Parameters',
        description: 'Hydraulic parameters (alpha, n, theta_r, theta_s) for silt loam, sandy loam, and clay soils',
        mimeType: 'application/json',
      },
    ];
  }

  public getPromptDefinitions(): MCPPromptDefinition[] {
    return [
      {
        name: 'multi_stress_field_triaging',
        description: 'Standard operating protocol for decoupling drought from nitrogen deficiency on the edge',
        arguments: [
          { name: 'crop_species', description: 'Crop type (e.g. Zea mays, Triticum aestivum)', required: true },
          { name: 'growth_stage', description: 'Phenological stage (e.g. V6, Anthesis)', required: true },
        ],
      },
    ];
  }

  /**
   * Main JSON-RPC 2.0 dispatcher compliant with Model Context Protocol
   */
  public async handleJsonRpc(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    const { id, method, params = {} } = request;

    try {
      switch (method) {
        case 'initialize':
          return {
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: '2025-11-25',
              serverInfo: {
                name: 'phytocausal-edge-server',
                version: '1.2.0',
              },
              capabilities: {
                tools: {},
                resources: {},
                prompts: {},
              },
            },
          };

        case 'tools/list':
          return {
            jsonrpc: '2.0',
            id,
            result: {
              tools: this.getToolDefinitions(),
            },
          };

        case 'tools/call': {
          const toolName = params.name as string;
          const args = (params.arguments || {}) as Record<string, unknown>;

          if (toolName === 'phytocausal_disambiguate_stress') {
            const soil = args.soilTelemetry as SoilTelemetry;
            const canopy = args.canopyTraits as CanopyTraits;
            const res = this.disambiguator.evaluate(soil, canopy);
            return { jsonrpc: '2.0', id, result: res };
          }

          if (toolName === 'phytocausal_verify_biokinetics') {
            const leafTempC = (args.leafTempC as number) ?? 25.0;
            const ciPpm = (args.ciPpm as number) ?? 280.0;
            const parUmols = (args.parUmols as number) ?? 1200.0;
            const stomatalConductance = (args.stomatalConductance as number) ?? 0.25;
            const reportedAn = (args.reportedAn as number) ?? 15.0;
            const res = this.governor.evaluateEnvelope(leafTempC, ciPpm, parUmols, stomatalConductance, reportedAn);
            return { jsonrpc: '2.0', id, result: res };
          }

          if (toolName === 'phytocausal_counterfactual_do') {
            const soil = args.soilTelemetry as SoilTelemetry;
            const canopy = args.canopyTraits as CanopyTraits;
            const query = args.query as CounterfactualQuery;
            const res = this.disambiguator.evaluateCounterfactual(soil, canopy, query);
            return { jsonrpc: '2.0', id, result: res };
          }

          if (toolName === 'phytocausal_extract_canopy_traits') {
            const r = (args.meanR as number) ?? 95;
            const g = (args.meanG as number) ?? 145;
            const b = (args.meanB as number) ?? 60;
            const canopyTemp = (args.canopyTempC as number) ?? 27.5;
            const ambTemp = (args.ambientTempC as number) ?? 25.0;
            const res = this.traitExtractor.extractTraits(r, g, b, canopyTemp, ambTemp);
            return { jsonrpc: '2.0', id, result: res };
          }

          if (toolName === 'phytocausal_parse_soil_telemetry') {
            const psiM = (args.psiM as number) ?? -45.0;
            const vwc = (args.vwc as number) ?? 0.28;
            const bulkEC = (args.bulkEC as number) ?? 1.4;
            const nitrateMgL = (args.nitrateMgL as number) ?? 48.0;
            const res = this.soilParser.parseSoilLog(psiM, vwc, bulkEC, nitrateMgL);
            return { jsonrpc: '2.0', id, result: res };
          }

          if (toolName === 'phytocausal_audit_edge_budget') {
            const device = (args.targetDevice as any) || 'Raspberry Pi 4 (Cortex-A72)';
            const res = this.resourceRouter.auditBudget(device);
            return { jsonrpc: '2.0', id, result: res };
          }

          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Tool '${toolName}' not found`,
            },
          };
        }

        case 'resources/list':
          return {
            jsonrpc: '2.0',
            id,
            result: {
              resources: this.getResourceDefinitions(),
            },
          };

        case 'resources/read': {
          const uri = params.uri as string;
          if (uri === 'phytocausal://agronomy/fvcb-c3-constants') {
            return {
              jsonrpc: '2.0',
              id,
              result: {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(
                  {
                    species: 'Triticum aestivum / Zea mays',
                    vcmax25_umol_m2_s1: 110.0,
                    jmax25_umol_m2_s1: 195.0,
                    kc25_ubar: 404.9,
                    ko25_mbar: 278.4,
                    gammaStar25_ubar: 42.75,
                    ea_vcmax_J_mol1: 65330.0,
                    ea_jmax_J_mol1: 43900.0,
                    ea_rd_J_mol1: 46390.0,
                    tpu_umol_m2_s1: 12.0,
                  },
                  null,
                  2
                ),
              },
            };
          }

          if (uri === 'phytocausal://agronomy/critical-nitrogen-dilution') {
            return {
              jsonrpc: '2.0',
              id,
              result: {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(
                  {
                    model: 'Justes Critical Nitrogen Dilution Curve',
                    citation: 'Justes et al. (1994) Annals of Botany 74: 397-407',
                    equation: 'Nc = a * W^(-b) = 4.8 * W^(-0.32)',
                    parameters: {
                      a_intercept_percent: 4.8,
                      b_power_dilution: 0.32,
                      w_critical_threshold_t_ha: 1.55,
                      constant_pre_critical_percent: 4.4,
                    },
                    nitrogen_nutrition_index: 'NNI = N_actual / N_critical',
                    diagnostic_thresholds: {
                      luxury_consumption: 'NNI > 1.05',
                      optimal_homeostasis: '0.95 <= NNI <= 1.05',
                      true_deficiency: 'NNI < 0.95 (valid only when transpiration is active)',
                    },
                  },
                  null,
                  2
                ),
              },
            };
          }

          if (uri === 'phytocausal://soil/van-genuchten-curves') {
            return {
              jsonrpc: '2.0',
              id,
              result: {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(
                  {
                    model: 'van Genuchten Closed-Form Unsaturated Hydraulic Retention',
                    citation: 'van Genuchten, M.T. (1980) Soil Sci. Soc. Am. J. 44: 892-898',
                    equation: 'Theta(h) = Theta_r + (Theta_s - Theta_r) / [1 + (|alpha * h|)^n]^m with m = 1 - 1/n',
                    soil_textures: {
                      silt_loam: {
                        theta_r: 0.067,
                        theta_s: 0.45,
                        alpha_inv_cm: 0.02,
                        n_pore_distribution: 1.41,
                        m: 0.291,
                        field_capacity_kPa: -33.0,
                        permanent_wilting_point_kPa: -1500.0,
                      },
                      sandy_loam: {
                        theta_r: 0.065,
                        theta_s: 0.41,
                        alpha_inv_cm: 0.075,
                        n_pore_distribution: 1.89,
                        m: 0.471,
                        field_capacity_kPa: -10.0,
                        permanent_wilting_point_kPa: -1500.0,
                      },
                      clay: {
                        theta_r: 0.07,
                        theta_s: 0.36,
                        alpha_inv_cm: 0.005,
                        n_pore_distribution: 1.09,
                        m: 0.083,
                        field_capacity_kPa: -50.0,
                        permanent_wilting_point_kPa: -1500.0,
                      },
                    },
                  },
                  null,
                  2
                ),
              },
            };
          }

          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: `Resource URI '${uri}' not recognized` },
          };
        }

        case 'prompts/list':
          return {
            jsonrpc: '2.0',
            id,
            result: {
              prompts: this.getPromptDefinitions(),
            },
          };

        default:
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Method '${method}' not implemented`,
            },
          };
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: `Internal edge execution error: ${errorMsg}`,
        },
      };
    }
  }
}
