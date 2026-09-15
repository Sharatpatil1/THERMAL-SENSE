const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { runThermalSimulation } = require('../thermal/thermalModel');
const { simulateRequestSchema } = require('../utils/validation');
const { generatePdfReport } = require('../services/reportService');
const db = require('../db/connection');

// Run thermal simulation
router.post('/run', async (req, res) => {
  try {
    const { error, value } = simulateRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { shelter, materials, weatherHourly } = value;
    const simulationResult = runThermalSimulation({
      shelter,
      materials,
      weatherHourly
    });

    return res.json({
      success: true,
      data: simulationResult
    });
  } catch (err) {
    console.error('[Simulation Run Error]', err.message);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Also support POST /api/simulate directly
router.post('/', async (req, res) => {
  try {
    const { error, value } = simulateRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { shelter, materials, weatherHourly } = value;
    const simulationResult = runThermalSimulation({
      shelter,
      materials,
      weatherHourly
    });

    return res.json({
      success: true,
      data: simulationResult
    });
  } catch (err) {
    console.error('[Simulation Direct Error]', err.message);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Save simulation to database
router.post('/save', async (req, res) => {
  try {
    const {
      simulationName,
      locationName,
      latitude,
      longitude,
      dateSimulated,
      weatherSource,
      designParameters,
      materialsUsed,
      simulationResults
    } = req.body;

    if (!simulationResults || !simulationResults.summary) {
      return res.status(400).json({
        success: false,
        error: 'Cannot save simulation: simulation results are missing.'
      });
    }

    const id = `SIM-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const name = simulationName || `Shelter-${locationName || 'Field'}-${dateSimulated || '2025-01-15'}`;
    const lat = Number(latitude) || 34.1526;
    const lon = Number(longitude) || 77.5771;
    const summary = simulationResults.summary;

    const simRecord = {
      id,
      simulation_name: name,
      location_name: locationName || 'Leh, Ladakh',
      latitude: lat,
      longitude: lon,
      date_simulated: dateSimulated || '2025-01-15',
      weather_source: weatherSource || 'NASA POWER API (Hourly)',
      design_parameters: designParameters,
      materials_used: materialsUsed,
      simulation_results: simulationResults,
      thermal_score: summary.thermalScore,
      comfort_percent: summary.comfortPercentage,
      avg_indoor_temp: summary.avgIndoorTemp,
      min_indoor_temp: summary.minIndoorTemp,
      max_indoor_temp: summary.maxIndoorTemp,
      total_heat_gain: summary.totalHeatGainWh,
      total_heat_loss: summary.totalHeatLossWh,
      heating_demand: summary.totalHeatingDemandKwh !== undefined ? summary.totalHeatingDemandKwh : Number((summary.totalHeatingDemandWh / 1000 || 0).toFixed(2)),
      cooling_demand: summary.totalCoolingDemandKwh !== undefined ? summary.totalCoolingDemandKwh : Number((summary.totalCoolingDemandWh / 1000 || 0).toFixed(2)),
      created_at: new Date().toISOString()
    };

    const dbStatus = db.getStatus();
    if (dbStatus.connected) {
      try {
        await db.query(
          `INSERT INTO simulations 
           (id, simulation_name, location_name, latitude, longitude, date_simulated, weather_source, 
            design_parameters, materials_used, simulation_results, thermal_score, comfort_percent, 
            avg_indoor_temp, min_indoor_temp, max_indoor_temp, total_heat_gain, total_heat_loss, heating_demand, cooling_demand)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, name, simRecord.location_name, lat, lon, simRecord.date_simulated, simRecord.weather_source,
            JSON.stringify(designParameters), JSON.stringify(materialsUsed), JSON.stringify(simulationResults),
            summary.thermalScore, summary.comfortPercentage, summary.avgIndoorTemp, summary.minIndoorTemp,
            summary.maxIndoorTemp, summary.totalHeatGainWh, summary.totalHeatLossWh, simRecord.heating_demand, simRecord.cooling_demand
          ]
        );
      } catch (err) {
        console.warn('[DB Save Simulation Warning]', err.message);
      }
    }

    const memStore = db.getMemoryStore();
    memStore.simulations.set(id, simRecord);

    return res.json({
      success: true,
      message: 'Simulation saved successfully',
      data: {
        id,
        simulationName: name,
        createdAt: simRecord.created_at
      }
    });
  } catch (err) {
    console.error('[Save Simulation Error]', err.message);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// List saved simulations
router.get('/', async (req, res) => {
  try {
    const dbStatus = db.getStatus();
    if (dbStatus.connected) {
      try {
        const rows = await db.query('SELECT id, simulation_name, location_name, latitude, longitude, date_simulated, thermal_score, comfort_percent, avg_indoor_temp, heating_demand, cooling_demand, created_at FROM simulations ORDER BY created_at DESC LIMIT 50');
        if (rows && rows.length > 0) {
          return res.json({
            success: true,
            data: rows
          });
        }
      } catch (err) {
        console.warn('[DB List Simulations Warning]', err.message);
      }
    }

    const memStore = db.getMemoryStore();
    const list = Array.from(memStore.simulations.values()).map(s => ({
      id: s.id,
      simulation_name: s.simulation_name,
      location_name: s.location_name,
      latitude: s.latitude,
      longitude: s.longitude,
      date_simulated: s.date_simulated,
      thermal_score: s.thermal_score,
      comfort_percent: s.comfort_percent,
      avg_indoor_temp: s.avg_indoor_temp,
      heating_demand: s.heating_demand || 0,
      cooling_demand: s.cooling_demand || 0,
      created_at: s.created_at
    })).reverse();

    return res.json({
      success: true,
      data: list
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Get simulation by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dbStatus = db.getStatus();

    if (dbStatus.connected) {
      try {
        const rows = await db.query('SELECT * FROM simulations WHERE id = ?', [id]);
        if (rows && rows.length > 0) {
          const r = rows[0];
          return res.json({
            success: true,
            data: {
              ...r,
              design_parameters: typeof r.design_parameters === 'string' ? JSON.parse(r.design_parameters) : r.design_parameters,
              materials_used: typeof r.materials_used === 'string' ? JSON.parse(r.materials_used) : r.materials_used,
              simulation_results: typeof r.simulation_results === 'string' ? JSON.parse(r.simulation_results) : r.simulation_results
            }
          });
        }
      } catch (err) {
        console.warn('[DB Get Simulation Warning]', err.message);
      }
    }

    const memStore = db.getMemoryStore();
    const record = memStore.simulations.get(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        error: `Simulation with ID '${id}' not found.`
      });
    }

    return res.json({
      success: true,
      data: record
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Stream PDF report for a saved simulation
router.get('/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    let simData = null;

    const dbStatus = db.getStatus();
    if (dbStatus.connected) {
      const rows = await db.query('SELECT * FROM simulations WHERE id = ?', [id]);
      if (rows && rows.length > 0) {
        const r = rows[0];
        simData = {
          ...r,
          design_parameters: typeof r.design_parameters === 'string' ? JSON.parse(r.design_parameters) : r.design_parameters,
          materials_used: typeof r.materials_used === 'string' ? JSON.parse(r.materials_used) : r.materials_used,
          simulation_results: typeof r.simulation_results === 'string' ? JSON.parse(r.simulation_results) : r.simulation_results
        };
      }
    }

    if (!simData) {
      const memStore = db.getMemoryStore();
      simData = memStore.simulations.get(id);
    }

    if (!simData) {
      return res.status(404).json({
        success: false,
        error: `Simulation '${id}' not found.`
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ThermalSense_Report_${id}.pdf`);
    generatePdfReport(simData, res);
  } catch (err) {
    console.error('[PDF Route Error]', err.message);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Stream PDF report from request body for active simulation
router.post('/generate-pdf', async (req, res) => {
  try {
    const simData = req.body;
    if (!simData || !simData.simulation_results) {
      return res.status(400).json({
        success: false,
        error: 'Simulation results are required to generate report.'
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ThermalSense_Report_${Date.now()}.pdf`);
    generatePdfReport(simData, res);
  } catch (err) {
    console.error('[Generate PDF Error]', err.message);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
