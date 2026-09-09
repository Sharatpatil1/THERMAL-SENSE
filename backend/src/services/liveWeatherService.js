const axios = require('axios');

const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_SATELLITE_URL = 'https://satellite-api.open-meteo.com/v1/satellite-radiation';
const REQUEST_TIMEOUT_MS = 15000;

function assertCoordinates(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new Error('Invalid latitude: must be a number between -90 and 90 degrees.');
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    throw new Error('Invalid longitude: must be a number between -180 and 180 degrees.');
  }
  return { lat, lon };
}

function parseNumber(value, field) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`Live weather provider returned invalid ${field}.`);
  return n;
}

function nearestIndex(times, targetIso) {
  if (!Array.isArray(times) || times.length === 0) return -1;
  const target = new Date(targetIso).getTime();
  let best = -1;
  let bestDiff = Infinity;
  for (let i = 0; i < times.length; i += 1) {
    const t = new Date(times[i]).getTime();
    if (!Number.isFinite(t)) continue;
    const diff = Math.abs(t - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return best;
}

function toLocalHourKey(iso) {
  return String(iso).slice(0, 13);
}

async function fetchLiveWeatherData({ latitude, longitude }) {
  const { lat, lon } = assertCoordinates(latitude, longitude);

  // Open-Meteo's current conditions are based on high-frequency model data.
  // Hourly data is also fetched for the thermal simulation window.
  let forecast;
  try {
    const response = await axios.get(OPEN_METEO_FORECAST_URL, {
      params: {
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,is_day',
        hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,shortwave_radiation,shortwave_radiation_instant',
        forecast_days: 2,
        past_days: 1,
        timezone: 'auto',
        wind_speed_unit: 'ms',
        temperature_unit: 'celsius'
      },
      timeout: REQUEST_TIMEOUT_MS,
      headers: { 'User-Agent': 'ThermalSense/1.0' }
    });
    forecast = response.data;
  } catch (err) {
    if (err.response) {
      throw new Error(`Live weather provider error (${err.response.status}): ${err.response.data?.reason || err.response.statusText || 'Request failed.'}`);
    }
    throw new Error(`Failed to connect to live weather provider: ${err.message}`);
  }

  if (!forecast?.current || !forecast?.hourly?.time) {
    throw new Error('Live weather provider returned an incomplete response.');
  }

  // Satellite radiation provides a closer-to-observation solar signal than a forecast model.
  // It may be unavailable for a location/time; in that case we keep the value null rather than inventing it.
  let satellite = null;
  try {
    const satelliteResponse = await axios.get(OPEN_METEO_SATELLITE_URL, {
      params: {
        latitude: lat,
        longitude: lon,
        hourly: 'shortwave_radiation_instant',
        forecast_days: 1,
        timezone: 'auto'
      },
      timeout: REQUEST_TIMEOUT_MS,
      headers: { 'User-Agent': 'ThermalSense/1.0' }
    });
    satellite = satelliteResponse.data;
  } catch (err) {
    // Satellite coverage can legitimately be unavailable. Do not fail the whole weather request.
    console.warn('[LiveWeather] Satellite radiation unavailable:', err.message);
  }

  const c = forecast.current;
  const currentTimestamp = c.time;

  let currentSolar = null;
  let currentSolarTimestamp = null;
  if (satellite?.hourly?.time && satellite?.hourly?.shortwave_radiation_instant) {
    const idx = nearestIndex(satellite.hourly.time, currentTimestamp);
    if (idx >= 0) {
      const candidate = Number(satellite.hourly.shortwave_radiation_instant[idx]);
      const satelliteTime = satellite.hourly.time[idx];
      const diffMinutes = Math.abs(new Date(satelliteTime).getTime() - new Date(currentTimestamp).getTime()) / 60000;
      if (Number.isFinite(candidate) && diffMinutes <= 45) {
        currentSolar = Math.max(0, candidate);
        currentSolarTimestamp = satelliteTime;
      }
    }
  }

  const h = forecast.hourly;
  const hourly = [];
  const targetDate = String(currentTimestamp).slice(0, 10);

  for (let i = 0; i < h.time.length; i += 1) {
    if (!String(h.time[i]).startsWith(targetDate)) continue;

    const temperature = Number(h.temperature_2m?.[i]);
    const humidity = Number(h.relative_humidity_2m?.[i]);
    const windSpeed = Number(h.wind_speed_10m?.[i]);
    const solar = Number(h.shortwave_radiation?.[i]);
    if (![temperature, humidity, windSpeed, solar].every(Number.isFinite)) continue;

    hourly.push({
      hour: hourly.length,
      time: String(h.time[i]).slice(11, 16),
      timestamp: h.time[i],
      temperature: Number(temperature.toFixed(2)),
      humidity: Number(humidity.toFixed(1)),
      windSpeed: Number(windSpeed.toFixed(2)),
      solarRadiation: Number(Math.max(0, solar).toFixed(1)),
      solarRadiationSource: 'Open-Meteo weather model'
    });
  }

  // Keep the thermal model contract: exactly 24 records for the local calendar day.
  if (hourly.length !== 24) {
    throw new Error(`Live weather provider returned ${hourly.length} complete hourly records for ${targetDate}; 24 are required for thermal simulation.`);
  }

  const currentTemperature = parseNumber(c.temperature_2m, 'temperature');
  const currentHumidity = parseNumber(c.relative_humidity_2m, 'relative humidity');
  const currentWind = parseNumber(c.wind_speed_10m, 'wind speed');

  // Replace only the current-hour model solar value with satellite instantaneous radiation when available.
  const currentHour = Number(String(currentTimestamp).slice(11, 13));
  const currentRecord = hourly.find(row => row.time.startsWith(String(currentHour).padStart(2, '0')));
  if (currentRecord && currentSolar !== null) {
    currentRecord.solarRadiation = Number(currentSolar.toFixed(1));
    currentRecord.solarRadiationSource = 'Open-Meteo satellite radiation';
    currentRecord.solarRadiationTimestamp = currentSolarTimestamp;
  }

  const sum = (key) => hourly.reduce((acc, row) => acc + Number(row[key] || 0), 0);
  const temps = hourly.map(x => x.temperature);

  return {
    source: 'Open-Meteo live weather + satellite solar',
    provider: 'Open-Meteo',
    latitude: lat,
    longitude: lon,
    timezone: forecast.timezone,
    utcOffsetSeconds: forecast.utc_offset_seconds,
    timestamp: currentTimestamp,
    dataAge: 'current provider conditions',
    current: {
      timestamp: currentTimestamp,
      temperature: Number(currentTemperature.toFixed(2)),
      humidity: Number(currentHumidity.toFixed(1)),
      windSpeed: Number(currentWind.toFixed(2)),
      windDirection: Number(c.wind_direction_10m),
      isDay: Boolean(c.is_day),
      solarRadiation: currentSolar === null ? null : Number(currentSolar.toFixed(1)),
      solarRadiationTimestamp: currentSolarTimestamp,
      solarRadiationSource: currentSolar === null ? null : 'Open-Meteo satellite radiation'
    },
    date: targetDate,
    timeStandard: forecast.timezone,
    parameters: ['temperature_2m', 'relative_humidity_2m', 'wind_speed_10m', 'shortwave_radiation'],
    summary: {
      avgTemperature: Number((sum('temperature') / 24).toFixed(2)),
      minTemperature: Number(Math.min(...temps).toFixed(2)),
      maxTemperature: Number(Math.max(...temps).toFixed(2)),
      avgHumidity: Number((sum('humidity') / 24).toFixed(1)),
      avgWindSpeed: Number((sum('windSpeed') / 24).toFixed(2)),
      maxSolarRadiation: Number(Math.max(...hourly.map(x => x.solarRadiation)).toFixed(1)),
      totalSolarRadiationWh: Number(sum('solarRadiation').toFixed(1)),
      recordsCount: 24
    },
    hourly,
    dataQuality: {
      currentWeather: 'model-based current conditions',
      solarCurrent: currentSolar === null ? 'unavailable' : 'satellite instantaneous',
      hourlySimulation: 'hourly weather model',
      syntheticFallbackUsed: false
    }
  };
}

module.exports = { fetchLiveWeatherData };
