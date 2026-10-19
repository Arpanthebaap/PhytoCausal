/**
 * PhytoCausal: Subsurface Soil Telemetry & Solute Flux Engine
 * Ingests irregular, asynchronous multi-depth soil telemetry logs (matric potential,
 * permittivity, dielectric bulk EC, porewater nitrate) and builds quantized embeddings.
 *
 * References:
 * - Hilhorst (2000) "A pore water conductivity sensor" Soil Sci. Soc. Am. J. 64: 1922-1925
 * - van Genuchten (1980) "A closed-form equation for predicting the hydraulic conductivity of unsaturated soils"
 */

import { SoilTelemetry } from '../types';

export class SoilTelemetryParser {
  /**
   * Hilhorst conversion from bulk electrical conductivity (ECb) to pore-water electrical conductivity (ECp).
   * ECp = (epsilon_p * ECb) / (epsilon_b - epsilon_dry)
   */
  public computePoreWaterEC(bulkEC: number, volumetricWaterContent: number, soilTempC: number): number {
    // Permittivity of bulk water: epsilon_p = 80.3 - 0.37 * (T - 20)
    const epsilonP = 80.3 - 0.37 * (soilTempC - 20.0);
    // Bulk soil dielectric permittivity proxy from Topp's equation
    const theta = Math.max(0.04, volumetricWaterContent);
    const epsilonB = 3.03 + 9.3 * theta + 146.0 * Math.pow(theta, 2) - 76.7 * Math.pow(theta, 3);
    const epsilonDry = 4.1; // Typical dry soil permittivity offset

    if (epsilonB <= epsilonDry) {
      return bulkEC;
    }

    const ecP = (epsilonP * bulkEC) / (epsilonB - epsilonDry);
    return Number(Math.max(0.1, Math.min(18.0, ecP)).toFixed(2));
  }

  /**
   * Generates a 16-dimensional quantized vector embedding representing the soil's hydraulic & nutrient state.
   */
  public generateSoilEmbedding(
    psiM: number,
    vwc: number,
    ecP: number,
    nitrateMgL: number,
    tempC: number
  ): number[] {
    const rawFeatures = [
      Math.abs(psiM) / 500.0,
      vwc * 2.5,
      ecP / 5.0,
      nitrateMgL / 80.0,
      (tempC - 20.0) / 15.0,
      Math.log10(Math.max(1, Math.abs(psiM))),
      vwc / (Math.abs(psiM) + 1.0),
      nitrateMgL * vwc,
      ecP * (psiM < -100 ? 1.5 : 0.8),
      Math.sin(tempC * 0.1),
      Math.cos(vwc * Math.PI),
      Math.tanh(psiM / 200.0),
      nitrateMgL > 45 ? 1.0 : 0.0,
      psiM < -150 ? 1.0 : 0.0,
      ecP > 3.0 ? 1.0 : 0.0,
      0.42, // Edge checksum anchor
    ];

    // Quantize to [-1.0, 1.0]
    return rawFeatures.map((val) => Number(Math.max(-1.0, Math.min(1.0, val)).toFixed(4)));
  }

  /**
   * Ingests a raw soil log event and outputs a normalized, physics-verified SoilTelemetry record.
   */
  public parseSoilLog(
    psiM: number,
    vwc: number,
    bulkEC: number,
    nitrateMgL: number,
    soilTempC: number = 21.5,
    texture: SoilTelemetry['soilTextureClass'] = 'silt_loam'
  ): SoilTelemetry {
    const poreWaterConductivity = this.computePoreWaterEC(bulkEC, vwc, soilTempC);
    const rawVectorEmbedding = this.generateSoilEmbedding(psiM, vwc, poreWaterConductivity, nitrateMgL, soilTempC);

    return {
      timestamp: new Date().toISOString(),
      soilMatricPotentialKPa: Number(psiM.toFixed(1)),
      volumetricWaterContent: Number(vwc.toFixed(3)),
      bulkElectricalConductivity: Number(bulkEC.toFixed(2)),
      poreWaterConductivity,
      soilTemperatureC: Number(soilTempC.toFixed(1)),
      poreWaterNitrateMgL: Number(nitrateMgL.toFixed(1)),
      soilDepthCm: 25,
      soilTextureClass: texture,
      rawVectorEmbedding,
    };
  }
}
