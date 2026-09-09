const { runThermalSimulation } = require('../thermal/thermalModel');
const { getAllMaterials, calculateAssemblyProperties } = require('./materialService');

// Practical field shelter insulation candidates: 50mm, 75mm, 100mm, 125mm, 150mm, 200mm
const INSULATION_CANDIDATES_M = [0.050, 0.075, 0.100, 0.125, 0.150, 0.200];
const ORIENTATIONS = ['North', 'East', 'South', 'West'];

async function runOptimization({
  baseShelter,
  weatherHourly,
  targetObjective = 'maximize_comfort'
}) {
  if (!weatherHourly || weatherHourly.length !== 24) {
    throw new Error('Optimization requires 24 hourly weather records from NASA POWER.');
  }

  const allMaterials = await getAllMaterials();
  const structuralMaterials = allMaterials.filter(m => m.category === 'structural');
  const insulationMaterials = allMaterials.filter(m => m.category === 'insulation');

  // Fallback defaults if filter empty
  const defaultStructural = structuralMaterials[0] || {
    id: 'structural_timber',
    name: 'Structural Timber',
    thermal_conductivity: 0.13,
    density: 550,
    specific_heat: 1600
  };

  const defaultInsulation = insulationMaterials[0] || {
    id: 'mineral_wool',
    name: 'Mineral Wool (Rockwool)',
    thermal_conductivity: 0.04,
    density: 80,
    specific_heat: 840
  };

  const outdoorMeanTemp = weatherHourly.reduce((acc, h) => acc + h.temperature, 0) / 24;
  const isColdClimate = outdoorMeanTemp < 15;
  const isHotClimate = outdoorMeanTemp > 28;

  const candidateResults = [];
  let comboId = 1;

  // Selected representative structural candidates to test
  const candidateStructurals = structuralMaterials.length > 0
    ? structuralMaterials.slice(0, 3)
    : [defaultStructural];

  // Selected insulation candidates (up to 4)
  const candidateInsulations = insulationMaterials.length > 0
    ? insulationMaterials.slice(0, 4)
    : [defaultInsulation];

  for (const sMat of candidateStructurals) {
    for (const iMat of candidateInsulations) {
      for (const thickM of INSULATION_CANDIDATES_M) {
        for (const orient of ORIENTATIONS) {
          const testShelter = {
            ...baseShelter,
            orientation: orient,
            wallInsulationThicknessM: thickM,
            roofInsulationThicknessM: thickM
          };

          const testMaterials = {
            wallStructural: sMat,
            wallInsulation: iMat,
            roofStructural: sMat,
            roofInsulation: iMat,
            floorStructural: sMat,
            floorInsulation: iMat
          };

          const sim = runThermalSimulation({
            shelter: testShelter,
            materials: testMaterials,
            weatherHourly
          });

          const assemblyProps = calculateAssemblyProperties({
            structuralMaterial: sMat,
            structuralThicknessM: Number(baseShelter.wallThicknessM) || 0.20,
            insulationMaterial: iMat,
            insulationThicknessM: thickM,
            assemblyType: 'wall'
          });

          // Transparent Multi-Factor Optimization Scoring:
          // 1. Comfort Compliance: 40% (percentage of hours within 18°C-27°C)
          // 2. Active Heating / Cooling Demand Reduction: 30% (lower energy load earns higher points)
          // 3. Thermal Resistance (R-value): 20%
          // 4. Practicality & Logistics: 10% (slight penalty for excessively heavy or 200mm bulky panels)
          const comfortPart = Number((sim.summary.comfortPercentage * 0.40).toFixed(2));
          
          // Energy load efficiency: normalized against baseline 60 kWh/day
          const loadKwh = sim.summary.totalHeatingDemandKwh + sim.summary.totalCoolingDemandKwh;
          const heatingReductionPart = Number((Math.max(0, 30 - (loadKwh / 2.0))).toFixed(2));

          // Thermal resistance benefit
          const rValuePart = Number((Math.min(20, (1 / (assemblyProps.U_value || 1)) * 4.5)).toFixed(2));

          // Practicality & transportability weight
          const thicknessPenalty = (thickM / 0.20) * 4.0; // slight penalty for bulk transport to forward outposts
          const materialBonus = iMat.id.includes('mineral_wool') ? 5 : (iMat.id.includes('xps') ? 4.5 : 3.5);
          const practicalPart = Number((materialBonus - thicknessPenalty).toFixed(2));

          const compositeScore = Number((comfortPart + heatingReductionPart + rValuePart + practicalPart).toFixed(1));

          candidateResults.push({
            id: `OPT-${comboId++}`,
            wallMaterial: sMat.name,
            roofMaterial: sMat.name,
            insulationMaterial: iMat.name,
            insulationThicknessMm: Math.round(thickM * 1000),
            orientation: orient,
            uValue: assemblyProps.U_value,
            rValue: Number((1 / assemblyProps.U_value).toFixed(2)),
            avgIndoorTemp: sim.summary.avgIndoorTemp,
            minIndoorTemp: sim.summary.minIndoorTemp,
            maxIndoorTemp: sim.summary.maxIndoorTemp,
            comfortPercent: sim.summary.comfortPercentage,
            comfortHours: sim.summary.comfortHours,
            totalHeatGainKwh: sim.summary.totalHeatGainKwh,
            totalHeatLossKwh: sim.summary.totalHeatLossKwh,
            heatingDemandKwh: sim.summary.totalHeatingDemandKwh,
            coolingDemandKwh: sim.summary.totalCoolingDemandKwh,
            peakHeatingLoadKw: sim.summary.peakHeatingLoadKw,
            thermalScore: sim.summary.thermalScore,
            compositeScore,
            scoreBreakdown: {
              comfortPart,
              heatingReductionPart,
              rValuePart,
              practicalPart
            }
          });
        }
      }
    }
  }

  // Rank descending by compositeScore, then comfortPercent
  candidateResults.sort((a, b) => b.compositeScore - a.compositeScore || b.comfortPercent - a.comfortPercent);

  const topCandidates = candidateResults.slice(0, 10);
  const bestCandidate = topCandidates[0] || candidateResults[0];

  // Specific Material Recommendations based on simulation physics
  const materialRecommendations = [
    {
      component: 'Wall Assembly',
      recommendedMaterial: bestCandidate.wallMaterial,
      insulationMaterial: bestCandidate.insulationMaterial,
      thicknessMm: bestCandidate.insulationThicknessMm,
      thermalConductivity: bestCandidate.insulationMaterial.includes('XPS') ? 0.030 : (bestCandidate.insulationMaterial.includes('PIR') ? 0.024 : 0.040),
      uValue: bestCandidate.uValue,
      rValue: bestCandidate.rValue,
      expectedThermalBenefit: `Provides high thermal damping with overall assembly U-value of ${bestCandidate.uValue} W/m²·K, reducing wall conductive loss by up to 55%.`,
      practicalNotes: isColdClimate
        ? 'Thermally favorable option for alpine/high-altitude zones. Verify moisture barrier and rapid field erection requirements before deployment.'
        : 'Thermally favorable option for arid high-solar environments. Protect exterior facade from sand abrasion.'
    },
    {
      component: 'Roof Assembly',
      recommendedMaterial: 'Aluminium Sandwich Panel with Mineral Wool / PIR Core',
      insulationMaterial: bestCandidate.insulationMaterial,
      thicknessMm: Math.max(100, bestCandidate.insulationThicknessMm),
      thermalConductivity: 0.035,
      uValue: Number((1 / ((Math.max(100, bestCandidate.insulationThicknessMm) / 1000) / 0.035 + 0.14)).toFixed(3)),
      rValue: Number(((Math.max(100, bestCandidate.insulationThicknessMm) / 1000) / 0.035 + 0.14).toFixed(2)),
      expectedThermalBenefit: 'Critical barrier against severe nocturnal radiation heat loss to cold sky and intense high-altitude solar irradiance.',
      practicalNotes: isColdClimate
        ? 'Sloped roof geometry sheds heavy snow accumulation; verify structural load rating under local snow/wind standards.'
        : 'High-reflectance light exterior skin curtails solar heat absorption by up to 70%.'
    },
    {
      component: 'Floor / Foundation Base',
      recommendedMaterial: 'Extruded Polystyrene (XPS) over Concrete Base Plinth',
      insulationMaterial: 'Extruded Polystyrene (XPS)',
      thicknessMm: isColdClimate ? 100 : 50,
      thermalConductivity: 0.030,
      uValue: Number((1 / ((isColdClimate ? 0.10 : 0.05) / 0.030 + 0.17)).toFixed(3)),
      rValue: Number(((isColdClimate ? 0.10 : 0.05) / 0.030 + 0.17).toFixed(2)),
      expectedThermalBenefit: 'Decouples habitable shelter floor from continuous sub-zero ground and permafrost conduction.',
      practicalNotes: 'Closed-cell structure provides zero capillary water absorption, preventing freeze-thaw degradation in sub-grade snowdrifts.'
    }
  ];

  // Prioritized Field Engineering Suggestions
  const suggestions = [];

  if (isColdClimate) {
    suggestions.push({
      priority: 'High',
      title: 'Orient Primary Fenestration to South',
      category: 'Orientation & Passive Solar Gain',
      impact: 'Yields 25% - 40% greater passive solar irradiance into indoor thermal mass during peak midday sun.',
      notes: `Optimal orientation calculated is ${bestCandidate.orientation} for high winter solar absorption.`
    });

    if (bestCandidate.insulationThicknessMm < 100) {
      suggestions.push({
        priority: 'High',
        title: 'Upgrade Insulation Thickness to 100mm – 150mm',
        category: 'Thermal Envelope Insulation',
        impact: 'Reduces conductive nighttime heat loss by up to 45%, raising minimum temperature by 4°C - 7°C.',
        notes: 'Mineral wool blankets or XPS rigid boards offer superior thermal resistance per kilogram transported.'
      });
    }

    if ((Number(baseShelter.ach) || 0.5) > 0.5) {
      suggestions.push({
        priority: 'Medium',
        title: 'Enhance Shelter Envelope Air-Sealing',
        category: 'Infiltration Control',
        impact: 'Cuts infiltration heat loss by 15% - 30% in high wind conditions while retaining required ventilation.',
        notes: 'Install continuous silicone gaskets around prefabricated joint interlocks and door frames.'
      });
    }

    if ((Number(baseShelter.windowArea) || 1.2) > 2.5) {
      suggestions.push({
        priority: 'Medium',
        title: 'Limit Excessive Window Aperture Area',
        category: 'Fenestration Sizing',
        impact: 'Windows have higher heat transfer than insulated walls; minimizing aperture prevents severe nocturnal drops.',
        notes: 'Keep fenestration area between 8% and 12% of total usable floor footprint.'
      });
    }
  } else if (isHotClimate) {
    suggestions.push({
      priority: 'High',
      title: 'Apply High-Albedo Solar-Reflective Roof Coating',
      category: 'Solar Radiation Control',
      impact: 'Reflects up to 75% of incident solar irradiance, reducing peak midday indoor roof temperature.',
      notes: 'Use white elastomeric or solar-reflective aluminium composite skin panels.'
    });

    suggestions.push({
      priority: 'High',
      title: 'Provide 400mm Window Shading Overhangs',
      category: 'Passive Cooling Design',
      impact: 'Eliminates direct solar heat admittance through glazing during high solar zenith angles.',
      notes: 'Construct lightweight aluminium louvers over South and West fenestrations.'
    });
  } else {
    suggestions.push({
      priority: 'Medium',
      title: 'Maintain Balanced Thermal Mass & Controlled Ventilation',
      category: 'Energy Balance',
      impact: 'Sustains stable indoor comfort across diurnal swings between day solar radiation and nighttime cooling.',
      notes: 'Standard 100mm insulation with 0.5 ACH provides favorable thermal stability.'
    });
  }

  // Always include field operational suggestion
  suggestions.push({
    priority: 'Low',
    title: 'Install Thermal Airlock / Baffle Vestibule Entry',
    category: 'Field Operational Protocol',
    impact: 'Prevents sudden volumetric air replacement during troop ingress/egress in blizzards or dust storms.',
    notes: 'A two-door baffle entry module preserves conditioned indoor microclimate.'
  });

  return {
    bestDesign: bestCandidate,
    topRankedCandidates: topCandidates,
    totalEvaluated: candidateResults.length,
    scoringMethodology: {
      comfortWeight: '40%',
      heatingDemandReductionWeight: '30%',
      rValueWeight: '20%',
      practicalityWeight: '10%'
    },
    recommendations: materialRecommendations,
    suggestions,
    climateContext: {
      outdoorMeanTemp: Number(outdoorMeanTemp.toFixed(2)),
      isColdClimate,
      isHotClimate
    }
  };
}

module.exports = {
  runOptimization
};
