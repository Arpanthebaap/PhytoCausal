/**
 * PhytoCausal: Foliar Optical & Radiometric Canopy Trait Extractor
 * Computer vision pipeline for extracting physiological traits from close-up leaf imagery
 * and FLIR thermal radiometry on edge devices (ARM NEON / ONNX Runtime).
 *
 * References:
 * - Woebbecke et al. (1995) "Color indices for weed identification under various soil, residue, and lighting conditions"
 * - Gitelson et al. (2002) "Novel algorithms for remote estimation of vegetation fraction"
 */

import { CanopyTraits } from '../types';

export class CanopyTraitExtractor {
  /**
   * Simulates/extracts leaf indices from RGB color channel ratios and radiometric thermal telemetry.
   * On edge hardware, this is backed by quantized OpenCV/ONNX vision kernels.
   */
  public extractTraits(
    meanR: number,
    meanG: number,
    meanB: number,
    canopyTempC: number,
    ambientTempC: number,
    parUmols: number = 1200.0
  ): CanopyTraits {
    const sum = meanR + meanG + meanB + 1e-6;
    const rNorm = meanR / sum;
    const gNorm = meanG / sum;
    const bNorm = meanB / sum;

    // 1. Excess Green Index: ExG = 2*G - R - B
    const excessGreenIndex = Number((2 * gNorm - rNorm - bNorm).toFixed(3));

    // 2. Normalized Difference Green-Red Index: NDGRI = (G - R) / (G + R)
    const ndgri = Number(((gNorm - rNorm) / (gNorm + rNorm + 1e-6)).toFixed(3));

    // 3. Anthocyanin / Stress Pigment Index: ARI proxy = (1 / G) - (1 / R)
    const anthocyaninRaw = Math.max(0, (1.0 / (gNorm + 0.05) - 1.0 / (rNorm + 0.05)) * 0.15);
    const anthocyaninIndex = Number(Math.min(1.0, anthocyaninRaw).toFixed(3));

    // 4. Chlorophyll Index (SPAD calibrated proxy from Green-to-Red ratio)
    // Healthy dark green: SPAD 45-60. Chlorotic pale yellow: SPAD 15-25.
    const spadRaw = 18.0 + (gNorm / (rNorm + 0.01)) * 14.5;
    const chlorophyllIndexSPAD = Number(Math.max(5.0, Math.min(65.0, spadRaw)).toFixed(1));

    // 5. Canopy Thermal Delta: ΔTc = Tcanopy - Tambient
    const canopyTempDeltaC = Number((canopyTempC - ambientTempC).toFixed(2));

    // 6. Stomatal Conductance Proxy (gsw in mol m-2 s-1)
    // Empirically derived from Jackson Crop Water Stress Index (CWSI):
    // Active transpirational cooling (ΔTc < 0) implies open stomata (gsw > 0.25).
    // Elevated canopy temp (ΔTc > +2.0°C) indicates stomatal closure to minimize water loss.
    let gswProxy = 0.35 - (canopyTempDeltaC / 5.0) * 0.28;
    gswProxy = Math.max(0.01, Math.min(0.48, gswProxy));
    const stomatalConductanceProxy = Number(gswProxy.toFixed(3));

    // 7. Leaf Curling Ratio (0.0 flat to 1.0 wilted roll)
    // Turgor loss leads to leaf axial rolling to minimize direct solar insolation intercept.
    const curlingRaw = canopyTempDeltaC > 1.0 ? Math.min(0.95, (canopyTempDeltaC - 0.5) / 3.5) : 0.05;
    const leafCurlingRatio = Number(curlingRaw.toFixed(2));

    // 8. Internal CO2 (Ci) proxy
    // When stomata close (gsw drops), internal CO2 is drawn down by residual photosynthesis:
    const ciPpm = Number(Math.max(80.0, Math.min(380.0, 110.0 + gswProxy * 650.0)).toFixed(0));

    return {
      timestamp: new Date().toISOString(),
      chlorophyllIndexSPAD,
      anthocyaninIndex,
      canopyTempC,
      ambientTempC,
      canopyTempDeltaC,
      stomatalConductanceProxy,
      leafCurlingRatio,
      excessGreenIndex,
      normalizedDiffGreenRed: ndgri,
      internalCO2Ppm: ciPpm,
      photosyntheticallyActiveRadiation: parUmols,
    };
  }
}
