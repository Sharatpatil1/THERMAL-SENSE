const express = require('express');
const router = express.Router();
const { fetchNasaPowerWeatherData } = require('../services/weatherService');
const { weatherQuerySchema } = require('../utils/validation');

router.get('/', async (req, res) => {
  try {
    const { error, value } = weatherQuerySchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { latitude, longitude, date } = value;
    const weatherData = await fetchNasaPowerWeatherData({
      latitude,
      longitude,
      dateStr: date
    });

    return res.json({
      success: true,
      data: weatherData
    });
  } catch (err) {
    console.error('[Weather Route Error]', err.message);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
