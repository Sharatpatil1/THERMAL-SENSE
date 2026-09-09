const { calculateAssemblyProperties } = require('../services/materialService');

/**
 * Transparent Transient Lumped-Capacitance Thermal Engine
 * SIH 2026 – SIH26051 DRDO Decision-Support Prototype
 * 
 * Conforms to ISO 13790 / ASHRAE fundamentals for building energy simulation.
 * Uses SI units consistently:
 * - Temperature: °C (and Kelvin for radiation exchange)
 * - Energy: Wh and kWh
 * - Power: Watts (W) and Kilowatts (kW)
 * - Dimensions: meters (m)
 * - Thermal Conductivity: W/(m·K)
 * - U-value: W/(m²·K)
 */

// Fundamental Physical Constants
const RHO_AIR = 1.204;       // Air density at standard atmosphere (kg/m³)
const CP_AIR = 1005;         // Specific heat capacity of dry air (J/kg·K)
const H_OUTDOOR = 25.0;      // Outdoor combined convective/radiative heat transfer coefficient (W/m²·K)
const STEFAN_BOLTZMANN = 5.670374e-8; // Stefan-Boltzmann constant (W/m²·K⁴)
const DT_SECONDS = 3600;     // 1-hour simulation timestep in seconds

/**
 * Orientation factor for window fenestration aperture based on solar hour and shelter facade orientation
 */
function getOrientationFactor(orientation, hour) {
  // Sunlight hours typically 06:00 to 18:00
  if (hour < 6 || hour > 18) return 0.0;

  const normOrient = (orientation || 'South').toLowerCase();
  
  if (normOrient === 'south') {
    if (hour >= 10 && hour <= 14) return 0.75;
    if (hour >= 8 && hour <= 16) return 0.50;
    return 0.20;
  } else if (normOrient === 'east') {
    if (hour >= 7 && hour <= 10) return 0.70;
    if (hour < 12) return 0.40;
    return 0.10;
  } else if (normOrient === 'west') {
    if (hour >= 14 && hour <= 17) return 0.70;
    if (hour >= 12) return 0.40;
    return 0.10;
  } else { // North
    return 0.18; // Predominantly diffuse sky radiation
  }
}

/**
 * Runs the 24-hour transient lumped capacitance thermal simulation
 */
function runThermalSimulation({
  shelter = {},
  materials = {},
  weatherHourly = []
}) {
  if (!Array.isArray(weatherHourly) || weatherHourly.length !== 24) {
    throw new Error('Simulation requires exactly 24 hourly weather records from NASA POWER.');
  }

  // Extract & validate shelter geometric parameters (SI units: meters)
  const length = Number(shelter.length) || 6.0;
  const width = Number(shelter.width) || 4.0;
  const height = Number(shelter.height) || 2.8;

  if (length <= 0 || width <= 0 || height <= 0) {
    throw new Error('Shelter length, width, and height must be strictly positive numbers.');
  }

  const orientation = shelter.orientation || 'South';
  const windowArea = Math.max(0, Number(shelter.windowArea) || 1.2);
  const doorArea = Math.max(0, Number(shelter.doorArea) || 1.8);
  const occupancy = Math.max(0, Number(shelter.occupancy) || 6);
  const ach = Math.max(0.05, Number(shelter.ach) || 0.5);
  const equipmentLoad = Math.max(0, Number(shelter.equipmentHeatLoadW) || 150);
  const lightingLoad = Math.max(0, Number(shelter.lightingHeatLoadW) || 60);
  
  // Setpoint temperatures for comfort & active HVAC load calculation
  const comfortMin = Number(shelter.comfortMin) !== undefined && !isNaN(Number(shelter.comfortMin))
    ? Number(shelter.comfortMin) : 18.0;
  const comfortMax = Number(shelter.comfortMax) !== undefined && !isNaN(Number(shelter.comfortMax))
    ? Number(shelter.comfortMax) : 27.0;

  if (comfortMin >= comfortMax) {
    throw new Error(`Comfort minimum (${comfortMin}°C) must be lower than comfort maximum (${comfortMax}°C).`);
  }

  // Geometry calculations
  const floorArea = length * width;
  const roofArea = length * width * 1.05; // 5% slope and eaves pitch allowance
  const grossWallArea = 2 * (length + width) * height;
  const totalOpenings = windowArea + doorArea;

  if (totalOpenings >= grossWallArea * 0.85) {
    throw new Error(`Total opening area (${totalOpenings.toFixed(1)} m²) cannot exceed 85% of gross wall area (${grossWallArea.toFixed(1)} m²).`);
  }

  const netWallArea = Math.max(1.0, grossWallArea - totalOpenings);
  const volume = length * width * height;

  // Component assembly thermal properties (U-value in W/m²·K, areal capacitance in J/m²·K)
  const wallProps = calculateAssemblyProperties({
    structuralMaterial: materials.wallStructural,
    structuralThicknessM: Number(shelter.wallThicknessM) || 0.20,
    insulationMaterial: materials.wallInsulation,
    insulationThicknessM: Number(shelter.wallInsulationThicknessM) || 0.10,
    assemblyType: 'wall'
  });

  const roofProps = calculateAssemblyProperties({
    structuralMaterial: materials.roofStructural,
    structuralThicknessM: Number(shelter.roofThicknessM) || 0.15,
    insulationMaterial: materials.roofInsulation,
    insulationThicknessM: Number(shelter.roofInsulationThicknessM) || 0.10,
    assemblyType: 'roof'
  });

  const floorProps = calculateAssemblyProperties({
    structuralMaterial: materials.floorStructural,
    structuralThicknessM: Number(shelter.floorThicknessM) || 0.15,
    insulationMaterial: materials.floorInsulation,
    insulationThicknessM: Number(shelter.floorInsulationThicknessM) || 0.05,
    assemblyType: 'floor'
  });

  // Glazing and door thermal parameters
  const U_window = 2.80; // W/m²·K (Double-glazed insulated sealed unit)
  const SHGC_window = 0.65; // Solar Heat Gain Coefficient
  const U_door = 2.00;   // W/m²·K (Insulated composite tactical door)

  // Overall building envelope UA (W/K)
  const UA_wall = wallProps.U_value * netWallArea;
  const UA_roof = roofProps.U_value * roofArea;
  const UA_floor = floorProps.U_value * floorArea;
  const UA_window = U_window * windowArea;
  const UA_door = U_door * doorArea;
  const UA_total = UA_wall + UA_roof + UA_floor + UA_window + UA_door;

  // Thermal Capacitance (J/K)
  const airCapacitance = RHO_AIR * CP_AIR * volume;
  const structEffFactor = 0.20; // 20% active diurnal thermal mass participation
  const structCapacitance = structEffFactor * (
    (netWallArea * wallProps.arealCapacitance) +
    (roofArea * roofProps.arealCapacitance) +
    (floorArea * floorProps.arealCapacitance)
  );
  const internalContentsCapacitance = 6000 * volume; // J/K for military gear, bunks, equipment
  const totalCapacitance = Math.max(1.2e6, airCapacitance + structCapacitance + internalContentsCapacitance);

  // Roof absorptance & emissivity
  const roofSolarAbsorptance = materials.roofStructural && materials.roofStructural.solar_absorptance
    ? materials.roofStructural.solar_absorptance : 0.65;
  const roofEmissivity = 0.90; // Standard thermal emissivity for roof exterior

  // Diurnal mean outdoor temperature for high-inertia ground heat exchange
  const avgOutdoorTemp = weatherHourly.reduce((acc, h) => acc + h.temperature, 0) / 24;
  const groundTemp = avgOutdoorTemp;

  // Initial indoor temperature state
  let currentIndoorTemp = shelter.initialIndoorTemp !== undefined && !isNaN(Number(shelter.initialIndoorTemp))
    ? Number(shelter.initialIndoorTemp)
    : Math.max(10, avgOutdoorTemp + 5);

  const hourlyResults = [];
  let totalHeatGainWh = 0;
  let totalHeatLossWh = 0;
  let totalHeatingDemandWh = 0;
  let totalCoolingDemandWh = 0;
  let maxHeatingLoadW = 0;
  let maxCoolingLoadW = 0;

  let sumIndoorTemp = 0;
  let minIndoor = Infinity;
  let maxIndoor = -Infinity;
  let comfortHours = 0;

  // Internal constant gains: 100 W/occupant sensible heat + equipment + lighting
  const internalGainWatts = (occupancy * 100) + equipmentLoad + lightingLoad;

  for (let i = 0; i < 24; i++) {
    const h = weatherHourly[i];
    const outdoorTemp = Number(h.temperature);
    const solarRadiation = Math.max(0, Number(h.solarRadiation)); // W/m²
    const windSpeed = Math.max(0, Number(h.windSpeed));           // m/s
    const deltaT = outdoorTemp - currentIndoorTemp;

    // Conduction heat rates (Watts)
    const qWall = UA_wall * deltaT;
    const qRoofCond = UA_roof * deltaT;
    const qFloor = UA_floor * (groundTemp - currentIndoorTemp);
    const qWindowCond = UA_window * deltaT;
    const qDoorCond = UA_door * deltaT;
    const qConduction = qWall + qRoofCond + qFloor + qWindowCond + qDoorCond;

    // Dynamic wind-assisted air infiltration (Watts)
    const dynamicACH = ach * (1 + 0.04 * windSpeed);
    const qInfiltration = ((RHO_AIR * CP_AIR * dynamicACH * volume) / 3600) * deltaT;

    // Solar gains (Watts)
    const orientFactor = getOrientationFactor(orientation, h.hour);
    const qSolarWindow = solarRadiation * windowArea * SHGC_window * orientFactor;
    // Sol-air effect on roof
    const qSolarRoof = (roofSolarAbsorptance * solarRadiation * roofArea * (roofProps.U_value / H_OUTDOOR));
    const qSolar = Math.max(0, qSolarWindow + qSolarRoof);

    // Internal gains
    const qInternal = internalGainWatts;

    // Nocturnal long-wave radiative sky exchange using Kelvin temperatures
    let qSky = 0;
    if (solarRadiation < 10) {
      const tRoofK = outdoorTemp + 273.15;
      const tSkyK = Math.max(200, 0.0552 * Math.pow(tRoofK, 1.5)); // Swinbank nocturnal sky model
      const qRadBlackBody = roofEmissivity * STEFAN_BOLTZMANN * roofArea * (Math.pow(tRoofK, 4) - Math.pow(tSkyK, 4));
      qSky = Math.max(0, qRadBlackBody * (roofProps.U_value / H_OUTDOOR));
    }

    // Net instantaneous heat flow into shelter air (Watts)
    const qNet = qConduction + qInfiltration + qSolar + qInternal - qSky;

    // Separate into gross instantaneous gains and losses
    let hourlyGainW = 0;
    let hourlyLossW = 0;
    if (qConduction > 0) hourlyGainW += qConduction; else hourlyLossW += Math.abs(qConduction);
    if (qInfiltration > 0) hourlyGainW += qInfiltration; else hourlyLossW += Math.abs(qInfiltration);
    hourlyGainW += (qSolar + qInternal);
    hourlyLossW += qSky;

    totalHeatGainWh += hourlyGainW;
    totalHeatLossWh += hourlyLossW;

    // Active heating demand calculation (Watts) to maintain indoor setpoint >= comfortMin (e.g. 18°C)
    const deltaTHeatTarget = outdoorTemp - comfortMin;
    const qCondAtHeatSet = (UA_wall + UA_roof + UA_window + UA_door) * deltaTHeatTarget + UA_floor * (groundTemp - comfortMin);
    const qInfiltAtHeatSet = ((RHO_AIR * CP_AIR * dynamicACH * volume) / 3600) * deltaTHeatTarget;
    const qNetAtHeatSet = qCondAtHeatSet + qInfiltAtHeatSet + qSolar + qInternal - qSky;
    const hourlyHeatingDemandW = Math.max(0, -qNetAtHeatSet);
    totalHeatingDemandWh += hourlyHeatingDemandW;
    if (hourlyHeatingDemandW > maxHeatingLoadW) maxHeatingLoadW = hourlyHeatingDemandW;

    // Active cooling demand calculation (Watts) to maintain indoor setpoint <= comfortMax (e.g. 27°C)
    const deltaTCoolTarget = outdoorTemp - comfortMax;
    const qCondAtCoolSet = (UA_wall + UA_roof + UA_window + UA_door) * deltaTCoolTarget + UA_floor * (groundTemp - comfortMax);
    const qInfiltAtCoolSet = ((RHO_AIR * CP_AIR * dynamicACH * volume) / 3600) * deltaTCoolTarget;
    const qNetAtCoolSet = qCondAtCoolSet + qInfiltAtCoolSet + qSolar + qInternal - qSky;
    const hourlyCoolingDemandW = Math.max(0, qNetAtCoolSet);
    totalCoolingDemandWh += hourlyCoolingDemandW;
    if (hourlyCoolingDemandW > maxCoolingLoadW) maxCoolingLoadW = hourlyCoolingDemandW;

    // Passive floating indoor temperature record
    const recordedTemp = Number(currentIndoorTemp.toFixed(2));
    sumIndoorTemp += recordedTemp;
    if (recordedTemp < minIndoor) minIndoor = recordedTemp;
    if (recordedTemp > maxIndoor) maxIndoor = recordedTemp;

    const isComfortable = recordedTemp >= comfortMin && recordedTemp <= comfortMax;
    if (isComfortable) comfortHours++;

    // Component surface temperatures estimation for 3D thermal view (°C)
    const tRoofEst = Number((outdoorTemp + (qRoofCond / (roofArea * (roofProps.U_value || 1)))).toFixed(2));
    const tWallEst = Number((outdoorTemp + (qWall / (netWallArea * (wallProps.U_value || 1)))).toFixed(2));
    const tFloorEst = Number((groundTemp + (qFloor / (floorArea * (floorProps.U_value || 1)))).toFixed(2));

    hourlyResults.push({
      hour: h.hour,
      time: h.time,
      outdoorTemp: Number(outdoorTemp.toFixed(2)),
      indoorTemp: recordedTemp,
      solarRadiation: Number(solarRadiation.toFixed(1)),
      windSpeed: Number(windSpeed.toFixed(2)),
      humidity: Number(h.humidity.toFixed(1)),
      conductionGainLoss: Number(qConduction.toFixed(1)),
      infiltrationGainLoss: Number(qInfiltration.toFixed(1)),
      solarGain: Number(qSolar.toFixed(1)),
      internalGain: Number(qInternal.toFixed(1)),
      skyLoss: Number(qSky.toFixed(1)),
      netHeatFlow: Number(qNet.toFixed(1)),
      heatingDemandW: Number(hourlyHeatingDemandW.toFixed(1)),
      coolingDemandW: Number(hourlyCoolingDemandW.toFixed(1)),
      isComfortable,
      componentTemps: {
        roof: tRoofEst,
        wall: tWallEst,
        floor: tFloorEst,
        indoor: recordedTemp,
        outdoor: Number(outdoorTemp.toFixed(2))
      }
    });

    // Euler transient numerical update (dt = 3600 seconds)
    const deltaTIndoor = (qNet * DT_SECONDS) / totalCapacitance;
    currentIndoorTemp = currentIndoorTemp + deltaTIndoor;
  }

  const avgIndoor = Number((sumIndoorTemp / 24).toFixed(2));
  const comfortPercentage = Number(((comfortHours / 24) * 100).toFixed(1));

  // Transparent Temperature Comfort Index (0 - 100)
  const midTarget = (comfortMin + comfortMax) / 2;
  const avgDeviation = hourlyResults.reduce((acc, hr) => acc + Math.abs(hr.indoorTemp - midTarget), 0) / 24;
  const scoreBase = comfortPercentage * 0.65;
  const penalty = Math.min(35, avgDeviation * 2.8);
  const thermalScore = Number(Math.max(5, Math.min(100, scoreBase + (35 - penalty))).toFixed(1));

  // Convert energy to kWh
  const totalHeatGainKwh = Number((totalHeatGainWh / 1000).toFixed(2));
  const totalHeatLossKwh = Number((totalHeatLossWh / 1000).toFixed(2));
  const totalHeatingDemandKwh = Number((totalHeatingDemandWh / 1000).toFixed(2));
  const totalCoolingDemandKwh = Number((totalCoolingDemandWh / 1000).toFixed(2));
  const netThermalLoadKwh = Number((totalHeatingDemandKwh + totalCoolingDemandKwh).toFixed(2));
  const peakHeatingLoadKw = Number((maxHeatingLoadW / 1000).toFixed(2));
  const peakCoolingLoadKw = Number((maxCoolingLoadW / 1000).toFixed(2));

  return {
    summary: {
      // Passive floating thermodynamic metrics (Calculated)
      avgIndoorTemp: avgIndoor,
      minIndoorTemp: Number(minIndoor.toFixed(2)),
      maxIndoorTemp: Number(maxIndoor.toFixed(2)),
      outdoorAvgTemp: Number((weatherHourly.reduce((acc, h) => acc + h.temperature, 0) / 24).toFixed(2)),
      comfortHours,
      comfortPercentage,
      thermalScore,
      totalHeatGainWh: Number(totalHeatGainWh.toFixed(1)),
      totalHeatLossWh: Number(totalHeatLossWh.toFixed(1)),
      totalHeatGainKwh,
      totalHeatLossKwh,
      
      // Active HVAC / fuel sizing metrics (Calculated)
      totalHeatingDemandKwh,
      totalCoolingDemandKwh,
      netThermalLoadKwh,
      peakHeatingLoadKw,
      peakCoolingLoadKw,

      // Envelope structural properties
      envelope: {
        UA_total: Number(UA_total.toFixed(2)),
        wall_U: wallProps.U_value,
        roof_U: roofProps.U_value,
        floor_U: floorProps.U_value,
        netWallArea: Number(netWallArea.toFixed(1)),
        roofArea: Number(roofArea.toFixed(1)),
        floorArea: Number(floorArea.toFixed(1)),
        totalCapacitanceMJ: Number((totalCapacitance / 1e6).toFixed(2))
      },

      // Comfort band criteria
      comfortBand: {
        min: comfortMin,
        max: comfortMax,
        label: 'Temperature Comfort Index (Decision-Support Band: 18°C - 27°C)'
      },

      // Engineering documentation & transparency
      methodology: {
        modelType: 'Transient lumped-capacitance 24-hour heat balance',
        timeStepSeconds: 3600,
        weatherDataSource: 'NASA POWER Hourly Point Observations (Real Data)',
        disclaimer: 'Decision-support simulation prototype. Physical field validation required prior to construction.'
      }
    },
    hourly: hourlyResults
  };
}

module.exports = {
  runThermalSimulation,
  getOrientationFactor
};
