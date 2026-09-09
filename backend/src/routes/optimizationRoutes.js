const express = require('express');
const router = express.Router();
const { runOptimization } = require('../services/optimizationService');

router.post('/', async (req, res) => {
  try {
    const { baseShelter, weatherHourly, targetObjective } = req.body;

    if (!baseShelter) {
      return res.status(400).json({
        success: false,
        error: 'Base shelter configuration is required.'
      });
    }

    if (!weatherHourly || !Array.isArray(weatherHourly) || weatherHourly.length !== 24) {
      return res.status(400).json({
        success: false,
        error: 'NASA POWER climate data with 24 hourly records is required for optimization.'
      });
    }

    const optimizationResult = await runOptimization({
      baseShelter,
      weatherHourly,
      targetObjective
    });

    return res.json({
      success: true,
      data: optimizationResult
    });
  } catch (err) {
    console.error('[Optimization Route Error]', err.message);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
