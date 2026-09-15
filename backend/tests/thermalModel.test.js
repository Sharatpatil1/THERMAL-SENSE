const assert = require('assert');
const { runThermalSimulation, getOrientationFactor } = require('../src/thermal/thermalModel');
const { runOptimization } = require('../src/services/optimizationService');
const { calculateAssemblyProperties } = require('../src/services/materialService');

console.log('--- Starting Thermal Sense Backend Tests ---');

// 1. Test Assembly Calculations
{
  const props = calculateAssemblyProperties({
    structuralMaterial: { thermal_conductivity: 0.13, density: 550, specific_heat: 1600 },
    structuralThicknessM: 0.20,
    insulationMaterial: { thermal_conductivity: 0.04, density: 80, specific_heat: 840 },
    insulationThicknessM: 0.10,
    assemblyType: 'wall'
  });

  // R_total = 0.13 (R_si) + (0.20/0.13) + (0.10/0.04) + 0.04 (R_se)
  // R_struct = 1.5385, R_insul = 2.5, R_total = 0.13 + 1.5385 + 2.5 + 0.04 = 4.2085
  // U = 1 / 4.2085 = 0.2376
  assert.ok(props.U_value > 0.20 && props.U_value < 0.28, `U-value ${props.U_value} should be approx 0.24`);
  assert.ok(props.R_total > 3.5, `R_total should be > 3.5`);
  console.log('✓ Assembly properties (U-value, R-value) test passed.');
}

// 2. Test Orientation Factors
{
  assert.strictEqual(getOrientationFactor('South', 2), 0.0, 'Night hour should have 0 solar factor');
  assert.strictEqual(getOrientationFactor('South', 12), 0.75, 'Noon South orientation should have peak factor');
  assert.strictEqual(getOrientationFactor('East', 8), 0.70, 'Morning East orientation should peak');
  console.log('✓ Orientation solar factors test passed.');
}

// 3. Test 24-hour Thermal Simulation
{
  // 24 synthetic hourly records for test purposes only (prompt allows synthetic in automated unit tests)
  const syntheticHourly = [];
  for (let i = 0; i < 24; i++) {
    // Diurnal variation: cold night (-15°C) to daytime high (-2°C)
    const temp = -15 + 13 * Math.sin(((i - 6) / 24) * 2 * Math.PI);
    const solar = (i >= 7 && i <= 17) ? Math.sin(((i - 7) / 10) * Math.PI) * 600 : 0;
    syntheticHourly.push({
      hour: i,
      time: `${String(i).padStart(2, '0')}:00`,
      temperature: temp,
      humidity: 60,
      windSpeed: 2.5,
      solarRadiation: solar
    });
  }

  const result = runThermalSimulation({
    shelter: {
      length: 6.0,
      width: 4.0,
      height: 2.8,
      orientation: 'South',
      windowArea: 1.2,
      doorArea: 1.8,
      occupancy: 6,
      ach: 0.5,
      equipmentHeatLoadW: 150,
      lightingHeatLoadW: 60,
      initialIndoorTemp: 12.0
    },
    materials: {
      wallStructural: { thermal_conductivity: 0.13, density: 550, specific_heat: 1600 },
      wallInsulation: { thermal_conductivity: 0.035, density: 35, specific_heat: 1500 },
      roofStructural: { thermal_conductivity: 0.05, density: 45, specific_heat: 900, solar_absorptance: 0.65 },
      roofInsulation: { thermal_conductivity: 0.035, density: 35, specific_heat: 1500 },
      floorStructural: { thermal_conductivity: 0.22, density: 1200, specific_heat: 1000 },
      floorInsulation: { thermal_conductivity: 0.030, density: 35, specific_heat: 1500 }
    },
    weatherHourly: syntheticHourly
  });

  assert.strictEqual(result.hourly.length, 24, 'Must return 24 hourly simulation steps');
  assert.ok(typeof result.summary.thermalScore === 'number', 'Must compute thermal score');
  assert.ok(typeof result.summary.comfortPercentage === 'number', 'Must compute comfort percentage');
  assert.ok(result.summary.avgIndoorTemp > -15, 'Indoor temp should be buffered higher than extreme outdoor cold');
  console.log(`✓ 24-hour thermal simulation test passed (Avg Indoor: ${result.summary.avgIndoorTemp}°C, Score: ${result.summary.thermalScore}).`);
}

// 4. Test Optimization Engine
(async () => {
  const syntheticHourly = [];
  for (let i = 0; i < 24; i++) {
    syntheticHourly.push({
      hour: i,
      time: `${String(i).padStart(2, '0')}:00`,
      temperature: -10 + 10 * Math.sin(((i - 6) / 24) * 2 * Math.PI),
      humidity: 50,
      windSpeed: 3.0,
      solarRadiation: (i >= 8 && i <= 16) ? 500 : 0
    });
  }

  const opt = await runOptimization({
    baseShelter: { length: 6, width: 4, height: 2.8, ach: 0.5, windowArea: 1.2, doorArea: 1.8, occupancy: 6 },
    weatherHourly: syntheticHourly
  });

  assert.ok(opt.topRankedCandidates.length > 0, 'Should return ranked candidates');
  assert.ok(opt.recommendations.length > 0, 'Should return component recommendations');
  assert.ok(opt.suggestions.length > 0, 'Should return actionable suggestions');
  console.log(`✓ Optimization engine test passed (${opt.totalEvaluated} combinations evaluated, top score: ${opt.bestDesign.thermalScore}).`);
  console.log('--- All Thermal Sense Backend Tests Passed Successfully! ---');
})().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
