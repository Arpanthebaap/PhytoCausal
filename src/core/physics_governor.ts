/**
 * PhytoCausal: Biophysical Physics Governor
 * Enforces closed-form Farquhar-von Caemmerer-Berry (FvCB) photosynthesis kinetics
 * and thermodynamic boundary conditions on edge inference.
 *
 * References:
 * - Farquhar, von Caemmerer & Berry (1980) Planta 149: 78-90
 * - Bernacchi et al. (2001) Plant, Cell & Environment 24: 253-259
 * - Medlyn et al. (2002) Plant, Cell & Environment 25: 1167-1179
 */

import { FvCBConstants, FvCBGovernorOutput } from '../types';

export const DEFAULT_FVCB_C3_CONSTANTS: FvCBConstants = {
  vcmax25: 110.0, // μmol m-2 s-1 (typical healthy C3 leaf)
  jmax25: 195.0, // μmol m-2 s-1
  rd25: 1.5, // μmol m-2 s-1
  kc25: 404.9, // μbar
  ko25: 278.4, // mbar
  gammaStar25: 42.75, // μbar (CO2 compensation point)
  tpu: 12.0, // μmol m-2 s-1
  eaVc: 65330.0, // J mol-1
  eaJ: 43900.0, // J mol-1
  eaRd: 46390.0, // J mol-1
};

const R_GAS = 8.314; // J mol-1 K-1
const O2_PARTIAL_PRESSURE = 210.0; // mbar (ambient ~21% O2)

export class BioKineticGovernor {
  private constants: FvCBConstants;

  constructor(constants: FvCBConstants = DEFAULT_FVCB_C3_CONSTANTS) {
    this.constants = constants;
  }

  /**
   * Arrhenius temperature response function
   * k(T) = k25 * exp( (Ea * (Tk - 298.15)) / (R * Tk * 298.15) )
   */
  private arrhenius(k25: number, ea: number, tk: number): number {
    const exponent = (ea * (tk - 298.15)) / (R_GAS * tk * 298.15);
    return k25 * Math.exp(exponent);
  }

  /**
   * Evaluates the FvCB kinetic envelope given leaf temperature, internal CO2 (Ci),
   * stomatal conductance (gsw), and photosynthetically active radiation (PAR).
   */
  public evaluateEnvelope(
    leafTempC: number,
    ciPpm: number,
    parUmols: number = 1200.0,
    stomatalConductance: number = 0.25,
    reportedAn: number = 18.5
  ): FvCBGovernorOutput {
    const tk = leafTempC + 273.15; // Kelvin

    // 1. Temperature-adjusted kinetic parameters
    const kc = this.arrhenius(this.constants.kc25, this.constants.eaVc * 0.91, tk);
    const ko = this.arrhenius(this.constants.ko25, 36380.0, tk);
    const gammaStar = this.arrhenius(this.constants.gammaStar25, 37830.0, tk);
    const vcmax = this.arrhenius(this.constants.vcmax25, this.constants.eaVc, tk);
    const jmax = this.arrhenius(this.constants.jmax25, this.constants.eaJ, tk);
    const rd = this.arrhenius(this.constants.rd25, this.constants.eaRd, tk);

    // 2. Electron transport rate J under incident PAR
    // Non-rectangular hyperbola approximation
    const alpha = 0.24; // Quantum efficiency of PSII
    const theta = 0.85; // Curvature factor
    const term1 = alpha * parUmols + jmax;
    const discriminant = Math.max(0, term1 * term1 - 4 * theta * alpha * parUmols * jmax);
    const j = (term1 - Math.sqrt(discriminant)) / (2 * theta);

    // 3. Rubisco-limited carboxylation rate (Ac)
    const effectiveCi = Math.max(0.1, ciPpm);
    const denominatorAc = effectiveCi + kc * (1.0 + O2_PARTIAL_PRESSURE / ko);
    const ac = denominatorAc > 0 ? vcmax * ((effectiveCi - gammaStar) / denominatorAc) : 0;

    // 4. RuBP-regeneration limited electron transport rate (Aj)
    const denominatorAj = effectiveCi + 2.0 * gammaStar;
    const aj = denominatorAj > 0 ? (j / 4.0) * ((effectiveCi - gammaStar) / denominatorAj) : 0;

    // 5. Triose-phosphate utilization (TPU) rate (Ap)
    const ap = 3.0 * this.constants.tpu;

    // 6. Net photosynthetic assimilation ceiling: min(Ac, Aj, Ap) - Rd
    const kineticCeiling = Math.max(0, Math.min(ac, aj, ap) - rd);

    // 7. Transpiration estimation (E = gsw * VPD / Patm proxy in mmol m-2 s-1)
    // Saturated vapor pressure (Tetens formula)
    const esat = 0.61078 * Math.exp((17.27 * leafTempC) / (leafTempC + 237.3)); // kPa
    const eair = esat * 0.55; // Assume 55% ambient RH baseline
    const vpd = Math.max(0.2, esat - eair);
    const transpirationRateE = stomatalConductance * (vpd / 101.3) * 1000.0; // mmol m-2 s-1

    const waterUseEfficiency = transpirationRateE > 0 ? kineticCeiling / transpirationRateE : 0;

    // 8. Invariant boundary proof check
    // If the edge diagnostic reported an assimilation rate > 105% of kinetic ceiling,
    // or if transpiration occurs while stomatal conductance is clamped shut (gsw < 0.02), flag unphysical!
    const isPhysicallyPlausible = reportedAn <= kineticCeiling * 1.05 + 0.1 && (stomatalConductance >= 0.02 || reportedAn < 2.0);
    const violationDelta = isPhysicallyPlausible ? 0 : Math.max(0, reportedAn - kineticCeiling);

    // 9. Generate proof hash
    const checksum = Math.round((kineticCeiling * 137.0 + leafTempC * 31.0 + ciPpm * 7.0) % 65535);
    const hexCheck = checksum.toString(16).toUpperCase().padStart(4, '0');
    const proofHash = `0xPHYTO-${isPhysicallyPlausible ? 'PASS' : 'FAIL'}-${hexCheck}`;

    return {
      reportedPhotosynthesis: Number(reportedAn.toFixed(2)),
      carboxylationLimitAc: Number(ac.toFixed(2)),
      electronTransportLimitAj: Number(aj.toFixed(2)),
      tpuLimitAp: Number(ap.toFixed(2)),
      kineticCeiling: Number(kineticCeiling.toFixed(2)),
      transpirationRateE: Number(transpirationRateE.toFixed(2)),
      waterUseEfficiency: Number(waterUseEfficiency.toFixed(2)),
      isPhysicallyPlausible,
      proofHash,
      status: isPhysicallyPlausible ? 'PHYSICALLY_COMPLIANT' : 'OVERRIDE_TRIGGERED_UNPHYSICAL',
      violationDelta: Number(violationDelta.toFixed(2)),
    };
  }

  /**
   * Generates FvCB assimilation curve data across a range of internal CO2 values (Ci: 20 to 900 ppm)
   * for live visualization of Ac, Aj, and overall kinetic ceiling.
   */
  public generateCiCurve(leafTempC: number = 25.0, parUmols: number = 1200.0): Array<{
    ci: number;
    ac: number;
    aj: number;
    anet: number;
  }> {
    const points: Array<{ ci: number; ac: number; aj: number; anet: number }> = [];
    for (let ci = 20; ci <= 850; ci += 25) {
      const evalResult = this.evaluateEnvelope(leafTempC, ci, parUmols, 0.25, 0.0);
      points.push({
        ci,
        ac: evalResult.carboxylationLimitAc,
        aj: evalResult.electronTransportLimitAj,
        anet: evalResult.kineticCeiling,
      });
    }
    return points;
  }

  /**
   * Generates temperature response curve (5°C to 45°C) showing thermal optimum
   * and Rubisco / electron transport breakdown.
   */
  public generateTemperatureCurve(ciPpm: number = 280.0, parUmols: number = 1200.0): Array<{
    tempC: number;
    anet: number;
    vcmax: number;
  }> {
    const points: Array<{ tempC: number; anet: number; vcmax: number }> = [];
    for (let temp = 10; temp <= 45; temp += 2) {
      const evalResult = this.evaluateEnvelope(temp, ciPpm, parUmols, 0.25, 0.0);
      const tk = temp + 273.15;
      const vcmax = this.arrhenius(this.constants.vcmax25, this.constants.eaVc, tk);
      points.push({
        tempC: temp,
        anet: evalResult.kineticCeiling,
        vcmax: Number(vcmax.toFixed(1)),
      });
    }
    return points;
  }
}
