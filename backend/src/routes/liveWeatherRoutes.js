const express = require('express');
const router = express.Router();
const { fetchLiveWeatherData } = require('../services/liveWeatherService');
const { liveWeatherQuerySchema } = require('../utils/validation');

router.get('/', async (req, res) => {
  try {
    const { error, value } = liveWeatherQuerySchema.validate(req.query);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }

    const data = await fetchLiveWeatherData(value);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[Live Weather Route Error]', err.message);
    return res.status(502).json({
      success: false,
      error: err.message,
      code: 'LIVE_WEATHER_UNAVAILABLE'
    });
  }
});

module.exports = router;
