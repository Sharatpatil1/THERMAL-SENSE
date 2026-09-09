const axios = require('axios');
const db = require('../db/connection');

/**
 * Fetches 24 hourly records from the official NASA POWER API.
 * 
 * Endpoint: https://power.larc.nasa.gov/api/temporal/hourly/point
 * Parameters: T2M (Temperature at 2m, °C), RH2M (Relative Humidity at 2m, %),
 *             WS10M (Wind Speed at 10m, m/s), ALLSKY_SFC_SW_DWN (All Sky Surface Shortwave Downward Irradiance, W/m² or Wh/m²)
 * Community: SB (Sustainable Buildings)
 * Time Standard: LST (Local Solar Time)
 */
async function fetchNasaPowerWeatherData({ latitude, longitude, dateStr }) {
  // Validate coordinates
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (isNaN(lat) || lat < -90 || lat > 90) {
    throw new Error('Invalid latitude: must be a number between -90 and 90 degrees.');
  }

  if (isNaN(lon) || lon < -180 || lon > 180) {
    throw new Error('Invalid longitude: must be a number between -180 and 180 degrees.');
  }

  // Validate date format (YYYY-MM-DD)
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error('Invalid date format: must be YYYY-MM-DD (e.g. 2025-01-15).');
  }

  const inputDate = new Date(dateStr + 'T00:00:00Z');
  if (isNaN(inputDate.getTime())) {
    throw new Error('Invalid date provided.');
  }

  // NASA POWER cannot provide future or today-unprocessed data
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (inputDate > today) {
    throw new Error('NASA POWER climate data is historical observation data; date cannot be in the future.');
  }

  const yyyymmdd = dateStr.replace(/-/g, '');

  // Check cache first
  const cachedData = await getCachedWeather(lat, lon, dateStr);
  if (cachedData) {
    return {
      ...cachedData,
      source: 'NASA POWER API (Hourly) [Cached]'
    };
  }

  const url = 'https://power.larc.nasa.gov/api/temporal/hourly/point';
  const params = {
    parameters: 'T2M,RH2M,WS10M,ALLSKY_SFC_SW_DWN',
    community: 'SB',
    longitude: lon,
    latitude: lat,
    start: yyyymmdd,
    end: yyyymmdd,
    format: 'JSON',
    'time-standard': 'LST'
  };

  let response;
  try {
    response = await axios.get(url, {
      params,
      timeout: 18000,
      headers: {
        'User-Agent': 'ThermalSense-DRDO-Prototype/1.0'
      }
    });
  } catch (err) {
    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      throw new Error('NASA POWER API request timed out. The NASA server may be experiencing high load. Please retry in a moment.');
    }
    if (err.response) {
      const errMsg = err.response.data && err.response.data.messages ? err.response.data.messages.join('; ') : err.response.statusText;
      throw new Error(`NASA POWER API error (${err.response.status}): ${errMsg || 'Failed to fetch climate data.'}`);
    }
    throw new Error(`Failed to connect to NASA POWER API: ${err.message}`);
  }

  const data = response.data;
  if (!data || !data.properties || !data.properties.parameter) {
    throw new Error('NASA POWER API returned an unexpected response structure.');
  }

  const { T2M, RH2M, WS10M, ALLSKY_SFC_SW_DWN } = data.properties.parameter;

  if (!T2M || !RH2M || !WS10M || !ALLSKY_SFC_SW_DWN) {
    throw new Error('NASA POWER API response is missing one or more required parameters (T2M, RH2M, WS10M, ALLSKY_SFC_SW_DWN).');
  }

  // Parse 24 hourly values
  const hourly = [];
  const hoursKeys = Object.keys(T2M).sort();

  if (hoursKeys.length < 24) {
    throw new Error(`NASA POWER returned incomplete data: received only ${hoursKeys.length} hourly records instead of 24.`);
  }

  // Use exactly the 24 hours of the selected day
  const targetDayKeys = hoursKeys.filter(k => k.startsWith(yyyymmdd)).slice(0, 24);

  if (targetDayKeys.length !== 24) {
    throw new Error(`NASA POWER returned ${targetDayKeys.length} records for date ${dateStr}. Complete 24 hourly records are required.`);
  }

  let sumTemp = 0;
  let minTemp = Infinity;
  let maxTemp = -Infinity;
  let sumHumidity = 0;
  let sumWind = 0;
  let maxSolar = 0;
  let totalSolar = 0;

  for (let i = 0; i < 24; i++) {
    const key = targetDayKeys[i];
    const temp = T2M[key];
    const rh = RH2M[key];
    const ws = WS10M[key];
    const solar = ALLSKY_SFC_SW_DWN[key];

    // NASA uses -999 for missing values
    if (temp === -999 || temp === undefined || temp === null) {
      throw new Error(`NASA POWER returned incomplete data for this date/location (missing temperature at hour ${i}:00).`);
    }
    if (rh === -999 || rh === undefined || rh === null) {
      throw new Error(`NASA POWER returned incomplete data for this date/location (missing humidity at hour ${i}:00).`);
    }
    if (ws === -999 || ws === undefined || ws === null) {
      throw new Error(`NASA POWER returned incomplete data for this date/location (missing wind speed at hour ${i}:00).`);
    }
    if (solar === -999 || solar === undefined || solar === null) {
      throw new Error(`NASA POWER returned incomplete data for this date/location (missing solar radiation at hour ${i}:00).`);
    }

    const tVal = Number(temp);
    const rhVal = Math.max(0, Math.min(100, Number(rh)));
    const wsVal = Math.max(0, Number(ws));
    const solarVal = Math.max(0, Number(solar));

    sumTemp += tVal;
    if (tVal < minTemp) minTemp = tVal;
    if (tVal > maxTemp) maxTemp = tVal;
    sumHumidity += rhVal;
    sumWind += wsVal;
    if (solarVal > maxSolar) maxSolar = solarVal;
    totalSolar += solarVal;

    hourly.push({
      hour: i,
      time: `${String(i).padStart(2, '0')}:00`,
      temperature: Number(tVal.toFixed(2)),
      humidity: Number(rhVal.toFixed(1)),
      windSpeed: Number(wsVal.toFixed(2)),
      solarRadiation: Number(solarVal.toFixed(1))
    });
  }

  const summary = {
    avgTemperature: Number((sumTemp / 24).toFixed(2)),
    minTemperature: Number(minTemp.toFixed(2)),
    maxTemperature: Number(maxTemp.toFixed(2)),
    avgHumidity: Number((sumHumidity / 24).toFixed(1)),
    avgWindSpeed: Number((sumWind / 24).toFixed(2)),
    maxSolarRadiation: Number(maxSolar.toFixed(1)),
    totalSolarRadiationWh: Number(totalSolar.toFixed(1)),
    recordsCount: 24
  };

  const result = {
    source: 'NASA POWER API (Hourly)',
    latitude: lat,
    longitude: lon,
    date: dateStr,
    parameters: ['T2M', 'RH2M', 'WS10M', 'ALLSKY_SFC_SW_DWN'],
    community: 'SB',
    timeStandard: 'LST',
    summary,
    hourly
  };

  // Cache to database / memory
  await saveWeatherToCache(lat, lon, dateStr, result);

  return result;
}

async function getCachedWeather(latitude, longitude, dateStr) {
  const dbStatus = db.getStatus();
  const latRound = Number(Number(latitude).toFixed(4));
  const lonRound = Number(Number(longitude).toFixed(4));
  const cacheKey = `${latRound}_${lonRound}_${dateStr}`;

  if (dbStatus.connected) {
    try {
      const rows = await db.query(
        'SELECT hourly_data, summary, source FROM weather_cache WHERE ROUND(latitude, 4) = ? AND ROUND(longitude, 4) = ? AND date_str = ?',
        [latRound, lonRound, dateStr]
      );
      if (rows && rows.length > 0) {
        return {
          source: rows[0].source,
          latitude,
          longitude,
          date: dateStr,
          parameters: ['T2M', 'RH2M', 'WS10M', 'ALLSKY_SFC_SW_DWN'],
          summary: typeof rows[0].summary === 'string' ? JSON.parse(rows[0].summary) : rows[0].summary,
          hourly: typeof rows[0].hourly_data === 'string' ? JSON.parse(rows[0].hourly_data) : rows[0].hourly_data
        };
      }
    } catch (err) {
      console.warn('[WeatherService] Cache query error:', err.message);
    }
  }

  const memStore = db.getMemoryStore();
  if (memStore.weather_cache.has(cacheKey)) {
    return memStore.weather_cache.get(cacheKey);
  }

  return null;
}

async function saveWeatherToCache(latitude, longitude, dateStr, result) {
  const dbStatus = db.getStatus();
  const latRound = Number(Number(latitude).toFixed(4));
  const lonRound = Number(Number(longitude).toFixed(4));
  const cacheKey = `${latRound}_${lonRound}_${dateStr}`;

  if (dbStatus.connected) {
    try {
      await db.query(
        `INSERT INTO weather_cache (latitude, longitude, date_str, source, hourly_data, summary)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE hourly_data=VALUES(hourly_data), summary=VALUES(summary)`,
        [latRound, lonRound, dateStr, result.source, JSON.stringify(result.hourly), JSON.stringify(result.summary)]
      );
    } catch (err) {
      console.warn('[WeatherService] Failed to cache weather in DB:', err.message);
    }
  }

  const memStore = db.getMemoryStore();
  memStore.weather_cache.set(cacheKey, result);
}

module.exports = {
  fetchNasaPowerWeatherData,
  getCachedWeather
};
