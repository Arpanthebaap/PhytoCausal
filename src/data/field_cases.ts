/**
 * PhytoCausal: Real-World Agronomic Field Case Studies
 * Ground-truth verified multi-stress dilemmas illustrating correlation failure vs causal disambiguation.
 */

import { FieldCaseStudy } from '../types';

export const FIELD_CASE_STUDIES: FieldCaseStudy[] = [
  {
    id: 'midwest-corn-false-alarm',
    cropName: 'Zea mays (Maize / Field Corn)',
    variety: 'Pioneer P1197AM',
    location: 'Story County, Iowa, USA (US Corn Belt)',
    latitude: 42.0308,
    longitude: -93.6319,
    climateZone: 'Humid Continental (Dfa)',
    fieldDescription:
      'V8 vegetative growth stage under a 18-day mid-summer dry spell. Deep soil nitrate reserves remain high from spring pre-plant, but top 30cm soil moisture is critically depleted.',
    naiveCorrelationPrediction: {
      diagnosis: 'Severe Nitrogen Deficiency (NDVI = 0.41, Chlorosis Detected)',
      action: 'Broadcast 110 kg/ha Synthetic Urea immediately',
      catastrophicOutcome:
        'Added urea salts drastically drop soil osmotic potential in dry rootzone, triggering severe root tip necrosis, hydraulic cavitation, and $160/acre yield loss, followed by massive runoff pollution upon rain.',
    },
    telemetry: {
      timestamp: '2026-07-14T14:30:00Z',
      soilMatricPotentialKPa: -285.0, // Severely dry
      volumetricWaterContent: 0.138,
      bulkElectricalConductivity: 1.15,
      poreWaterConductivity: 2.1,
      soilTemperatureC: 28.4,
      poreWaterNitrateMgL: 72.0, // High nitrogen in soil!
      soilDepthCm: 25,
      soilTextureClass: 'silt_loam',
    },
    traits: {
      timestamp: '2026-07-14T14:30:00Z',
      chlorophyllIndexSPAD: 22.4, // Chlorotic appearance!
      anthocyaninIndex: 0.18,
      canopyTempC: 34.6,
      ambientTempC: 30.5,
      canopyTempDeltaC: 4.1, // Stomata closed, no transpirational cooling
      stomatalConductanceProxy: 0.042, // Stomatal shutdown
      leafCurlingRatio: 0.78, // Wilting roll
      excessGreenIndex: 0.12,
      normalizedDiffGreenRed: 0.08,
      internalCO2Ppm: 125,
      photosyntheticallyActiveRadiation: 1650,
    },
  },
  {
    id: 'swiss-rhone-wheat-leached',
    cropName: 'Triticum aestivum (Winter Wheat)',
    variety: 'CH Nara (Class Top)',
    location: 'Sion, Valais, Switzerland (Rhône Valley)',
    latitude: 46.2331,
    longitude: 7.3606,
    climateZone: 'Inner Alpine Valley (Cfb)',
    fieldDescription:
      'Stem elongation stage (Zadoks GS32) following heavy Alpine snowmelt runoff. Soil profile is water-saturated, which has driven deep nitrate leaching below the shallow crown root zone.',
    naiveCorrelationPrediction: {
      diagnosis: 'Uncertain Multi-Stress / Probable Waterlogging Stress',
      action: 'Hold all inputs and wait for soil to dry down',
      catastrophicOutcome:
        'Wheat enters rapid spikelet differentiation in a state of genuine nitrogen starvation, causing permanent yield loss of 2.2 tonnes/ha and protein content drop below milling standards.',
    },
    telemetry: {
      timestamp: '2026-05-18T10:15:00Z',
      soilMatricPotentialKPa: -24.0, // Moist, near field capacity
      volumetricWaterContent: 0.355,
      bulkElectricalConductivity: 0.72,
      poreWaterConductivity: 1.25,
      soilTemperatureC: 14.8,
      poreWaterNitrateMgL: 11.5, // Truly depleted nitrogen!
      soilDepthCm: 20,
      soilTextureClass: 'sandy_loam',
    },
    traits: {
      timestamp: '2026-05-18T10:15:00Z',
      chlorophyllIndexSPAD: 19.8,
      anthocyaninIndex: 0.32,
      canopyTempC: 16.2,
      ambientTempC: 18.5,
      canopyTempDeltaC: -2.3, // Strong transpirational cooling, stomata open!
      stomatalConductanceProxy: 0.34, // Active transpiration stream
      leafCurlingRatio: 0.08,
      excessGreenIndex: 0.11,
      normalizedDiffGreenRed: 0.06,
      internalCO2Ppm: 310,
      photosyntheticallyActiveRadiation: 1320,
    },
  },
  {
    id: 'andalusia-olive-vpd-shock',
    cropName: 'Olea europaea (Olive Orchard)',
    variety: 'Picual',
    location: 'Úbeda, Jaén, Andalusia, Spain',
    latitude: 38.0121,
    longitude: -3.3712,
    climateZone: 'Hot Mediterranean (Csa)',
    fieldDescription:
      'High summer heatwave (41°C) with extreme atmospheric vapor pressure deficit (VPD > 4.5 kPa). Drip irrigation line delivered adequate moisture, but leaves are curling and showing necrosis tips.',
    naiveCorrelationPrediction: {
      diagnosis: 'Potassium / Nitrogen Deficiency with Leaf Scorch',
      action: 'Apply foliar NPK fertilizer spray at 2.5% concentration',
      catastrophicOutcome:
        'Foliar salts under 41°C and closed stomata immediately desiccate the cuticle, resulting in massive defoliation and flower bud abortion.',
    },
    telemetry: {
      timestamp: '2026-08-04T15:45:00Z',
      soilMatricPotentialKPa: -62.0, // Moist soil from drip line
      volumetricWaterContent: 0.245,
      bulkElectricalConductivity: 1.45,
      poreWaterConductivity: 2.3,
      soilTemperatureC: 31.2,
      poreWaterNitrateMgL: 44.0,
      soilDepthCm: 35,
      soilTextureClass: 'clay',
    },
    traits: {
      timestamp: '2026-08-04T15:45:00Z',
      chlorophyllIndexSPAD: 34.2,
      anthocyaninIndex: 0.44,
      canopyTempC: 44.8,
      ambientTempC: 40.8,
      canopyTempDeltaC: 4.0, // Extreme thermal delta
      stomatalConductanceProxy: 0.038, // Stomata shut against atmospheric VPD
      leafCurlingRatio: 0.88,
      excessGreenIndex: 0.19,
      normalizedDiffGreenRed: 0.14,
      internalCO2Ppm: 140,
      photosyntheticallyActiveRadiation: 1850,
    },
  },
  {
    id: 'kenya-rift-valley-compound',
    cropName: 'Zea mays (Highland Maize)',
    variety: 'H614D Highland Hybrid',
    location: 'Nakuru County, Great Rift Valley, Kenya',
    latitude: -0.3031,
    longitude: 36.08,
    climateZone: 'Subtropical Highland (Cwb)',
    fieldDescription:
      'Smallholder rainfed plot at late vegetative stage during an extended dry spell. Both soil water reserves and organic nitrogen reserves are exhausted.',
    naiveCorrelationPrediction: {
      diagnosis: 'Severe Nitrogen Starvation',
      action: 'Apply immediate top-dress CAN (Calcium Ammonium Nitrate)',
      catastrophicOutcome:
        'CAN fertilizer pellets sit dissolved only partially on dry crust, creating high-salinity hot-spots that burn lateral root tips without entering plant tissues.',
    },
    telemetry: {
      timestamp: '2026-09-10T12:00:00Z',
      soilMatricPotentialKPa: -215.0, // Soil dry
      volumetricWaterContent: 0.142,
      bulkElectricalConductivity: 0.65,
      poreWaterConductivity: 1.8,
      soilTemperatureC: 24.1,
      poreWaterNitrateMgL: 14.2, // Soil nitrogen also low!
      soilDepthCm: 20,
      soilTextureClass: 'loam',
    },
    traits: {
      timestamp: '2026-09-10T12:00:00Z',
      chlorophyllIndexSPAD: 21.0,
      anthocyaninIndex: 0.35,
      canopyTempC: 28.5,
      ambientTempC: 25.2,
      canopyTempDeltaC: 3.3,
      stomatalConductanceProxy: 0.065,
      leafCurlingRatio: 0.62,
      excessGreenIndex: 0.14,
      normalizedDiffGreenRed: 0.09,
      internalCO2Ppm: 160,
      photosyntheticallyActiveRadiation: 1550,
    },
  },
];
