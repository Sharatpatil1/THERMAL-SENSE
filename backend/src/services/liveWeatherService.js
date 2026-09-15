const axios = require('axios');

const OPEN_METEO_FORECAST_URL =
  'https://api.open-meteo.com/v1/forecast';

const OPEN_METEO_SATELLITE_URL =
  'https://satellite-api.open-meteo.com/v1/satellite-radiation';

const REQUEST_TIMEOUT_MS = 15000;

// ============================================================
// LIVE WEATHER CACHE
// ============================================================

// Successful provider response is reused for 10 minutes.
const CACHE_TTL_MS = 10 * 60 * 1000;

// If provider temporarily returns 429/5xx,
// recently fetched REAL data may be used for up to 30 minutes.
const STALE_CACHE_MAX_MS = 30 * 60 * 1000;

const weatherCache = new Map();


// ============================================================
// CACHE HELPERS
// ============================================================

function getCacheKey(latitude, longitude, date) {
  return `${latitude.toFixed(4)},${longitude.toFixed(4)},${date}`;
}

function getCachedWeather(key) {
  const entry = weatherCache.get(key);

  if (!entry) {
    return null;
  }

  const ageMs = Date.now() - entry.cachedAt;

  return {
    data: entry.data,
    ageMs,
    fresh: ageMs <= CACHE_TTL_MS,
    staleUsable: ageMs <= STALE_CACHE_MAX_MS
  };
}

function saveCachedWeather(key, data) {
  weatherCache.set(key, {
    data,
    cachedAt: Date.now()
  });
}


// ============================================================
// VALIDATION
// ============================================================

function assertCoordinates(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new Error(
      'Invalid latitude: must be a number between -90 and 90 degrees.'
    );
  }

  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    throw new Error(
      'Invalid longitude: must be a number between -180 and 180 degrees.'
    );
  }

  return {
    lat,
    lon
  };
}

function assertDateFormat(date) {
  if (
    typeof date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    const error = new Error(
      'Date must be formatted as YYYY-MM-DD.'
    );

    error.code = 'INVALID_LIVE_WEATHER_DATE';

    throw error;
  }

  // Validate that the date is actually a real calendar date.
  const [year, month, day] = date.split('-').map(Number);

  const testDate = new Date(
    Date.UTC(year, month - 1, day)
  );

  if (
    testDate.getUTCFullYear() !== year ||
    testDate.getUTCMonth() !== month - 1 ||
    testDate.getUTCDate() !== day
  ) {
    const error = new Error(
      `Invalid calendar date: ${date}.`
    );

    error.code = 'INVALID_LIVE_WEATHER_DATE';

    throw error;
  }

  return date;
}


// ============================================================
// DATE HELPERS
// ============================================================

function addDays(dateString, days) {
  const [year, month, day] =
    dateString.split('-').map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  date.setUTCDate(date.getUTCDate() + days);

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0')
  ].join('-');
}

function getAllowedDateRange(providerToday) {
  return {
    today: providerToday,
    tomorrow: addDays(providerToday, 1)
  };
}

function validateRequestedDate(requestedDate, providerToday) {
  const { today, tomorrow } =
    getAllowedDateRange(providerToday);

  if (
    requestedDate !== today &&
    requestedDate !== tomorrow
  ) {
    const error = new Error(
      `Live weather is available only for today (${today}) and tomorrow (${tomorrow}). For past dates, use historical NASA POWER data. Dates after ${tomorrow} are not supported.`
    );

    error.code = 'LIVE_WEATHER_DATE_NOT_ALLOWED';

    throw error;
  }

  return {
    isToday: requestedDate === today,
    isTomorrow: requestedDate === tomorrow
  };
}


// ============================================================
// NUMBER / TIME HELPERS
// ============================================================

function parseNumber(value, field) {
  const n = Number(value);

  if (!Number.isFinite(n)) {
    throw new Error(
      `Live weather provider returned invalid ${field}.`
    );
  }

  return n;
}

function nearestIndex(times, targetIso) {
  if (!Array.isArray(times) || times.length === 0) {
    return -1;
  }

  const target = new Date(targetIso).getTime();

  if (!Number.isFinite(target)) {
    return -1;
  }

  let best = -1;
  let bestDiff = Infinity;

  for (let i = 0; i < times.length; i += 1) {
    const timestamp = new Date(times[i]).getTime();

    if (!Number.isFinite(timestamp)) {
      continue;
    }

    const diff = Math.abs(timestamp - target);

    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }

  return best;
}


// ============================================================
// MAIN LIVE / FORECAST WEATHER FUNCTION
// ============================================================

async function fetchLiveWeatherData({
  latitude,
  longitude,
  date
}) {
  const { lat, lon } =
    assertCoordinates(latitude, longitude);

  const requestedDate =
    assertDateFormat(date);

  // ==========================================================
  // OPEN-METEO FORECAST API
  // ==========================================================

  let forecast;

  try {
    const response = await axios.get(
      OPEN_METEO_FORECAST_URL,
      {
        params: {
          latitude: lat,
          longitude: lon,

          current:
            'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,is_day',

          hourly:
            'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,shortwave_radiation,shortwave_radiation_instant',

          forecast_days: 2,
          past_days: 1,

          timezone: 'auto',

          wind_speed_unit: 'ms',
          temperature_unit: 'celsius'
        },

        timeout: REQUEST_TIMEOUT_MS,

        headers: {
          'User-Agent': 'ThermalSense/1.0'
        }
      }
    );

    forecast = response.data;
  } catch (err) {
    console.error(
      `[LiveWeather] Forecast provider error ${
        err.response?.status || ''
      }:`,
      err.message
    );

    // We cannot determine whether the requested date
    // matches a cached entry unless a cache entry exists.
    // Cache fallback is handled below using the date-specific key.

    const cacheKey = getCacheKey(
      lat,
      lon,
      requestedDate
    );

    const cached =
      getCachedWeather(cacheKey);

    if (cached && cached.staleUsable) {
      console.warn(
        `[LiveWeather] Using cached provider data because live provider failed. Cache age: ${Math.round(
          cached.ageMs / 60000
        )} minutes`
      );

      return {
        ...cached.data,

        dataAge:
          `cached provider data (${Math.round(
            cached.ageMs / 60000
          )} minutes old)`,

        dataQuality: {
          ...cached.data.dataQuality,

          cacheStatus:
            'stale-cache-provider-unavailable',

          cacheAgeSeconds:
            Math.round(cached.ageMs / 1000),

          providerUnavailable: true,

          syntheticFallbackUsed: false
        }
      };
    }

    if (err.response) {
      const status =
        err.response.status;

      const reason =
        err.response.data?.reason ||
        err.response.statusText ||
        'Request failed.';

      throw new Error(
        `Live weather provider error (${status}): ${reason}`
      );
    }

    throw new Error(
      `Failed to connect to live weather provider: ${err.message}`
    );
  }


  // ==========================================================
  // VALIDATE PROVIDER RESPONSE
  // ==========================================================

  if (
    !forecast ||
    !forecast.current ||
    !forecast.hourly ||
    !Array.isArray(forecast.hourly.time)
  ) {
    throw new Error(
      'Live weather provider returned an incomplete response.'
    );
  }

  if (!forecast.timezone) {
    throw new Error(
      'Live weather provider did not return a timezone.'
    );
  }


  // ==========================================================
  // DETERMINE PROVIDER LOCAL DATE
  // ==========================================================

  const providerCurrentTimestamp =
    forecast.current.time;

  if (
    typeof providerCurrentTimestamp !== 'string' ||
    providerCurrentTimestamp.length < 10
  ) {
    throw new Error(
      'Live weather provider returned an invalid current timestamp.'
    );
  }

  // Open-Meteo returns local time because timezone=auto.
  const providerToday =
    providerCurrentTimestamp.slice(0, 10);

  const dateStatus =
    validateRequestedDate(
      requestedDate,
      providerToday
    );

  const isToday =
    dateStatus.isToday;

  const isTomorrow =
    dateStatus.isTomorrow;


  // ==========================================================
  // DATE-SPECIFIC CACHE
  // ==========================================================

  const cacheKey =
    getCacheKey(
      lat,
      lon,
      requestedDate
    );

  const cached =
    getCachedWeather(cacheKey);

  // Fresh cache
  if (cached && cached.fresh) {
    console.log(
      `[LiveWeather] Cache HIT for ${cacheKey} (${Math.round(
        cached.ageMs / 1000
      )}s old)`
    );

    return {
      ...cached.data,

      dataAge:
        `cached provider data (${Math.round(
          cached.ageMs / 1000
        )} seconds old)`,

      dataQuality: {
        ...cached.data.dataQuality,

        cacheStatus:
          'fresh-cache',

        cacheAgeSeconds:
          Math.round(cached.ageMs / 1000),

        syntheticFallbackUsed:
          false
      }
    };
  }


  console.log(
    `[LiveWeather] Cache MISS for ${cacheKey}. Processing ${requestedDate}...`
  );


  // ==========================================================
  // HOURLY DATA
  // ==========================================================

  const h = forecast.hourly;

  const hourly = [];

  for (
    let i = 0;
    i < h.time.length;
    i += 1
  ) {
    const timestamp =
      h.time[i];

    if (
      typeof timestamp !== 'string' ||
      !timestamp.startsWith(requestedDate)
    ) {
      continue;
    }

    const temperature =
      Number(
        h.temperature_2m?.[i]
      );

    const humidity =
      Number(
        h.relative_humidity_2m?.[i]
      );

    const windSpeed =
      Number(
        h.wind_speed_10m?.[i]
      );

    const solar =
      Number(
        h.shortwave_radiation?.[i]
      );

    // Never invent incomplete values.
    if (
      ![
        temperature,
        humidity,
        windSpeed,
        solar
      ].every(Number.isFinite)
    ) {
      continue;
    }

    hourly.push({
      hour: hourly.length,

      time:
        String(timestamp).slice(11, 16),

      timestamp,

      temperature:
        Number(
          temperature.toFixed(2)
        ),

      humidity:
        Number(
          humidity.toFixed(1)
        ),

      windSpeed:
        Number(
          windSpeed.toFixed(2)
        ),

      solarRadiation:
        Number(
          Math.max(0, solar).toFixed(1)
        ),

      solarRadiationSource:
        'Open-Meteo weather model'
    });
  }


  // ==========================================================
  // REQUIRE EXACTLY 24 HOURS
  // ==========================================================

  if (hourly.length !== 24) {
    throw new Error(
      `Live weather provider returned ${hourly.length} complete hourly records for ${requestedDate}; 24 are required for thermal simulation.`
    );
  }


  // ==========================================================
  // CURRENT CONDITIONS
  // ==========================================================

  let current;

  if (isToday) {
    // Today uses actual current provider conditions.

    const c =
      forecast.current;

    const currentTemperature =
      parseNumber(
        c.temperature_2m,
        'temperature'
      );

    const currentHumidity =
      parseNumber(
        c.relative_humidity_2m,
        'relative humidity'
      );

    const currentWind =
      parseNumber(
        c.wind_speed_10m,
        'wind speed'
      );

    const currentWindDirection =
      parseNumber(
        c.wind_direction_10m,
        'wind direction'
      );

    current = {
      timestamp:
        c.time,

      temperature:
        Number(
          currentTemperature.toFixed(2)
        ),

      humidity:
        Number(
          currentHumidity.toFixed(1)
        ),

      windSpeed:
        Number(
          currentWind.toFixed(2)
        ),

      windDirection:
        Number(
          currentWindDirection.toFixed(1)
        ),

      isDay:
        Boolean(c.is_day),

      solarRadiation:
        null,

      solarRadiationTimestamp:
        null,

      solarRadiationSource:
        null
    };
  } else {
    // Tomorrow does NOT have live current conditions.
    // Use the first forecast hour of the selected date
    // as the forecast snapshot.

    const firstHour =
      hourly[0];

    current = {
      timestamp:
        firstHour.timestamp,

      temperature:
        firstHour.temperature,

      humidity:
        firstHour.humidity,

      windSpeed:
        firstHour.windSpeed,

      windDirection:
        null,

      isDay:
        null,

      solarRadiation:
        firstHour.solarRadiation,

      solarRadiationTimestamp:
        firstHour.timestamp,

      solarRadiationSource:
        'Open-Meteo weather model'
    };
  }


  // ==========================================================
  // SATELLITE SOLAR
  // ONLY REQUIRED FOR TODAY
  // ==========================================================

  let satellite = null;

  if (isToday) {
    try {
      const satelliteResponse =
        await axios.get(
          OPEN_METEO_SATELLITE_URL,
          {
            params: {
              latitude: lat,
              longitude: lon,

              hourly:
                'shortwave_radiation_instant',

              forecast_days: 1,

              timezone: 'auto'
            },

            timeout:
              REQUEST_TIMEOUT_MS,

            headers: {
              'User-Agent':
                'ThermalSense/1.0'
            }
          }
        );

      satellite =
        satelliteResponse.data;
    } catch (err) {
      // Satellite is supplementary.
      // Never invent solar values.
      console.warn(
        '[LiveWeather] Satellite radiation unavailable:',
        err.message
      );
    }
  }


  // ==========================================================
  // CURRENT SATELLITE SOLAR
  // ==========================================================

  if (
    isToday &&
    satellite?.hourly?.time &&
    satellite?.hourly
      ?.shortwave_radiation_instant
  ) {
    const idx =
      nearestIndex(
        satellite.hourly.time,
        forecast.current.time
      );

    if (idx >= 0) {
      const candidate =
        Number(
          satellite.hourly
            .shortwave_radiation_instant[idx]
        );

      const satelliteTime =
        satellite.hourly.time[idx];

      const diffMinutes =
        Math.abs(
          new Date(satelliteTime).getTime() -
          new Date(
            forecast.current.time
          ).getTime()
        ) / 60000;

      if (
        Number.isFinite(candidate) &&
        diffMinutes <= 45
      ) {
        const solarValue =
          Math.max(
            0,
            candidate
          );

        current.solarRadiation =
          Number(
            solarValue.toFixed(1)
          );

        current.solarRadiationTimestamp =
          satelliteTime;

        current.solarRadiationSource =
          'Open-Meteo satellite radiation';


        // Replace matching current-hour
        // model solar with satellite value.
        const currentHour =
          String(
            forecast.current.time
          ).slice(11, 13);

        const currentRecord =
          hourly.find(
            row =>
              row.time.startsWith(
                currentHour
              )
          );

        if (currentRecord) {
          currentRecord.solarRadiation =
            Number(
              solarValue.toFixed(1)
            );

          currentRecord
            .solarRadiationSource =
            'Open-Meteo satellite radiation';

          currentRecord
            .solarRadiationTimestamp =
            satelliteTime;
        }
      }
    }
  }


  // ==========================================================
  // SUMMARY CALCULATIONS
  // ==========================================================

  const sum = key =>
    hourly.reduce(
      (acc, row) =>
        acc +
        Number(row[key] || 0),
      0
    );

  const temps =
    hourly.map(
      row => row.temperature
    );

  const maxSolar =
    Math.max(
      ...hourly.map(
        row => row.solarRadiation
      )
    );


  // ==========================================================
  // FINAL RESPONSE
  // ==========================================================

  const result = {
    source: isToday
      ? 'Open-Meteo live weather + satellite solar'
      : 'Open-Meteo forecast weather',

    provider:
      'Open-Meteo',

    latitude:
      lat,

    longitude:
      lon,

    timezone:
      forecast.timezone,

    utcOffsetSeconds:
      forecast.utc_offset_seconds,

    timestamp:
      current.timestamp,

    dataAge:
      isToday
        ? 'current provider conditions'
        : 'forecast provider data',

    dataMode:
      isToday
        ? 'LIVE'
        : 'FORECAST',

    current,

    date:
      requestedDate,

    timeStandard:
      forecast.timezone,

    parameters: [
      'temperature_2m',
      'relative_humidity_2m',
      'wind_speed_10m',
      'shortwave_radiation'
    ],

    summary: {
      avgTemperature:
        Number(
          (
            sum('temperature') /
            24
          ).toFixed(2)
        ),

      minTemperature:
        Number(
          Math.min(
            ...temps
          ).toFixed(2)
        ),

      maxTemperature:
        Number(
          Math.max(
            ...temps
          ).toFixed(2)
        ),

      avgHumidity:
        Number(
          (
            sum('humidity') /
            24
          ).toFixed(1)
        ),

      avgWindSpeed:
        Number(
          (
            sum('windSpeed') /
            24
          ).toFixed(2)
        ),

      maxSolarRadiation:
        Number(
          maxSolar.toFixed(1)
        ),

      totalSolarRadiationWh:
        Number(
          sum(
            'solarRadiation'
          ).toFixed(1)
        ),

      recordsCount:
        24
    },

    hourly,

    dataQuality: {
      currentWeather:
        isToday
          ? 'model-based current conditions'
          : 'forecast model conditions',

      solarCurrent:
        isToday
          ? (
              current.solarRadiation === null
                ? 'unavailable'
                : current
                    .solarRadiationSource
            )
          : 'forecast model',

      hourlySimulation:
        'hourly weather model',

      cacheStatus:
        'fresh-provider-data',

      cacheAgeSeconds:
        0,

      providerUnavailable:
        false,

      syntheticFallbackUsed:
        false
    }
  };


  // ==========================================================
  // SAVE REAL PROVIDER DATA
  // ==========================================================

  saveCachedWeather(
    cacheKey,
    result
  );

  console.log(
    `[LiveWeather] Provider data cached for ${cacheKey}`
  );

  return result;
}


// ============================================================
// EXPORT
// ============================================================

module.exports = {
  fetchLiveWeatherData
};