const axios = require('axios');
const db = require('../db/connection');

/*
 * ShelterX Weather Service
 *
 * NASA POWER:
 * - Primary source for historical complete observations.
 *
 * Open-Meteo:
 * - Used for today/tomorrow.
 * - Used as fallback when NASA POWER has incomplete recent data.
 *
 * No weather values are fabricated.
 */


/* ============================================================
   MAIN WEATHER FUNCTION
   ============================================================ */

async function fetchNasaPowerWeatherData({
  latitude,
  longitude,
  dateStr
}) {
  const lat = Number(latitude);
  const lon = Number(longitude);

  validateCoordinates(lat, lon);
  validateDate(dateStr);

  const requestedDate = new Date(`${dateStr}T00:00:00Z`);

  if (Number.isNaN(requestedDate.getTime())) {
    throw new Error('Invalid date provided.');
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  /*
   * Do not allow dates after tomorrow.
   */
  if (requestedDate > tomorrow) {
    throw new Error(
      'Weather data can only be requested for historical dates, today, or tomorrow.'
    );
  }

  /*
   * Cache
   */
  const cachedData = await getCachedWeather(
    lat,
    lon,
    dateStr
  );

  if (cachedData) {
    return {
      ...cachedData,
      source: `${cachedData.source} [Cached]`
    };
  }

  /*
   * TODAY / TOMORROW
   *
   * NASA POWER may not yet have complete observations.
   * Use Open-Meteo directly.
   */
  if (requestedDate >= today) {
    const openMeteoData =
      await fetchOpenMeteoWeatherData({
        latitude: lat,
        longitude: lon,
        dateStr
      });

    await saveWeatherToCache(
      lat,
      lon,
      dateStr,
      openMeteoData
    );

    return openMeteoData;
  }

  /*
   * HISTORICAL DATES
   *
   * NASA POWER first.
   */
  try {
    const nasaData =
      await fetchFromNasaPower({
        latitude: lat,
        longitude: lon,
        dateStr
      });

    await saveWeatherToCache(
      lat,
      lon,
      dateStr,
      nasaData
    );

    return nasaData;

  } catch (nasaError) {

    console.warn(
      `[WeatherService] NASA POWER unavailable for ${dateStr}: ${nasaError.message}`
    );

    /*
     * Recent historical fallback.
     */
    try {
      const openMeteoData =
        await fetchOpenMeteoWeatherData({
          latitude: lat,
          longitude: lon,
          dateStr
        });

      await saveWeatherToCache(
        lat,
        lon,
        dateStr,
        openMeteoData
      );

      return openMeteoData;

    } catch (fallbackError) {

      throw new Error(
        `NASA POWER data was incomplete and Open-Meteo fallback failed. ` +
        `NASA: ${nasaError.message} | ` +
        `Open-Meteo: ${fallbackError.message}`
      );
    }
  }
}


/* ============================================================
   NASA POWER
   ============================================================ */

async function fetchFromNasaPower({
  latitude,
  longitude,
  dateStr
}) {
  const yyyymmdd = dateStr.replace(/-/g, '');

  const url =
    'https://power.larc.nasa.gov/api/temporal/hourly/point';

  const params = {
    parameters:
      'T2M,RH2M,WS10M,ALLSKY_SFC_SW_DWN',

    community: 'SB',

    longitude: latitude === undefined
      ? undefined
      : longitude,

    latitude,

    start: yyyymmdd,
    end: yyyymmdd,

    format: 'JSON',

    'time-standard': 'LST'
  };

  let response;

  try {
    response = await axios.get(url, {
      params,
      timeout: 20000,
      headers: {
        'User-Agent': 'ShelterX-DRDO-Prototype/1.0'
      }
    });

  } catch (err) {

    if (
      err.code === 'ECONNABORTED' ||
      err.message?.toLowerCase().includes('timeout')
    ) {
      throw new Error(
        'NASA POWER API request timed out.'
      );
    }

    if (err.response) {
      let message =
        'Failed to fetch NASA POWER data.';

      if (
        err.response.data &&
        Array.isArray(
          err.response.data.messages
        )
      ) {
        message =
          err.response.data.messages.join('; ');
      }

      throw new Error(
        `NASA POWER API error (${err.response.status}): ${message}`
      );
    }

    throw new Error(
      `Failed to connect to NASA POWER API: ${err.message}`
    );
  }

  const data = response.data;

  if (
    !data ||
    !data.properties ||
    !data.properties.parameter
  ) {
    throw new Error(
      'NASA POWER API returned an unexpected response structure.'
    );
  }

  const {
    T2M,
    RH2M,
    WS10M,
    ALLSKY_SFC_SW_DWN
  } = data.properties.parameter;

  if (
    !T2M ||
    !RH2M ||
    !WS10M ||
    !ALLSKY_SFC_SW_DWN
  ) {
    throw new Error(
      'NASA POWER response is missing required parameters.'
    );
  }

  const keys = Object.keys(T2M)
    .filter(key =>
      key.startsWith(yyyymmdd)
    )
    .sort();

  if (keys.length !== 24) {
    throw new Error(
      `NASA POWER returned ${keys.length} hourly records instead of 24.`
    );
  }

  const hourly = [];

  let sumTemp = 0;
  let minTemp = Infinity;
  let maxTemp = -Infinity;

  let sumHumidity = 0;
  let sumWind = 0;

  let maxSolar = 0;
  let totalSolar = 0;

  for (let i = 0; i < 24; i++) {

    const key = keys[i];

    const temp = Number(T2M[key]);
    const humidity = Number(RH2M[key]);
    const wind = Number(WS10M[key]);
    const solar = Number(
      ALLSKY_SFC_SW_DWN[key]
    );

    if (
      !Number.isFinite(temp) ||
      temp <= -998
    ) {
      throw new Error(
        `NASA POWER returned missing temperature at hour ${i}:00.`
      );
    }

    if (
      !Number.isFinite(humidity) ||
      humidity <= -998
    ) {
      throw new Error(
        `NASA POWER returned missing humidity at hour ${i}:00.`
      );
    }

    if (
      !Number.isFinite(wind) ||
      wind <= -998
    ) {
      throw new Error(
        `NASA POWER returned missing wind speed at hour ${i}:00.`
      );
    }

    if (
      !Number.isFinite(solar) ||
      solar <= -998
    ) {
      throw new Error(
        `NASA POWER returned missing solar radiation at hour ${i}:00.`
      );
    }

    const rh =
      Math.max(0, Math.min(100, humidity));

    const ws =
      Math.max(0, wind);

    const sw =
      Math.max(0, solar);

    sumTemp += temp;

    minTemp =
      Math.min(minTemp, temp);

    maxTemp =
      Math.max(maxTemp, temp);

    sumHumidity += rh;
    sumWind += ws;

    maxSolar =
      Math.max(maxSolar, sw);

    totalSolar += sw;

    hourly.push({
      hour: i,

      time:
        `${String(i).padStart(2, '0')}:00`,

      temperature:
        Number(temp.toFixed(2)),

      humidity:
        Number(rh.toFixed(1)),

      windSpeed:
        Number(ws.toFixed(2)),

      solarRadiation:
        Number(sw.toFixed(1))
    });
  }

  return {
    source:
      'NASA POWER API (Hourly)',

    latitude,
    longitude,
    date: dateStr,

    parameters: [
      'T2M',
      'RH2M',
      'WS10M',
      'ALLSKY_SFC_SW_DWN'
    ],

    community: 'SB',

    timeStandard: 'LST',

    summary: {
      avgTemperature:
        Number((sumTemp / 24).toFixed(2)),

      minTemperature:
        Number(minTemp.toFixed(2)),

      maxTemperature:
        Number(maxTemp.toFixed(2)),

      avgHumidity:
        Number((sumHumidity / 24).toFixed(1)),

      avgWindSpeed:
        Number((sumWind / 24).toFixed(2)),

      maxSolarRadiation:
        Number(maxSolar.toFixed(1)),

      totalSolarRadiationWh:
        Number(totalSolar.toFixed(1)),

      recordsCount: 24
    },

    hourly
  };
}


/* ============================================================
   OPEN-METEO
   ============================================================ */

async function fetchOpenMeteoWeatherData({
  latitude,
  longitude,
  dateStr
}) {
  const url =
    'https://api.open-meteo.com/v1/forecast';

  let response;

  try {

    /*
     * IMPORTANT:
     *
     * Do NOT send past_days or forecast_days
     * together with start_date/end_date here.
     *
     * We explicitly request only the selected day.
     */
    response = await axios.get(url, {
      params: {
        latitude,
        longitude,

        hourly:
          'temperature_2m,relative_humidity_2m,wind_speed_10m,shortwave_radiation',

        start_date: dateStr,

        end_date: dateStr,

        timezone: 'auto',

        wind_speed_unit: 'ms'
      },

      timeout: 20000,

      headers: {
        'User-Agent':
          'ShelterX-DRDO-Prototype/1.0'
      }
    });

  } catch (err) {

    if (err.response) {

      let details = '';

      if (
        err.response.data &&
        err.response.data.reason
      ) {
        details =
          ` ${err.response.data.reason}`;
      }

      throw new Error(
        `Open-Meteo API error (${err.response.status}).${details}`
      );
    }

    throw new Error(
      `Failed to connect to Open-Meteo: ${err.message}`
    );
  }

  const data = response.data;

  if (
    !data ||
    !data.hourly ||
    !Array.isArray(data.hourly.time)
  ) {
    throw new Error(
      'Open-Meteo returned an unexpected response structure.'
    );
  }

  const times =
    data.hourly.time;

  const temperatures =
    data.hourly.temperature_2m;

  const humidities =
    data.hourly.relative_humidity_2m;

  const winds =
    data.hourly.wind_speed_10m;

  const solar =
    data.hourly.shortwave_radiation;

  if (
    !Array.isArray(temperatures) ||
    !Array.isArray(humidities) ||
    !Array.isArray(winds) ||
    !Array.isArray(solar)
  ) {
    throw new Error(
      'Open-Meteo response is missing required hourly parameters.'
    );
  }

  /*
   * Because timezone=auto is used,
   * Open-Meteo returns local-time records.
   */
  const indexes = [];

  for (
    let i = 0;
    i < times.length;
    i++
  ) {
    if (
      typeof times[i] === 'string' &&
      times[i].startsWith(dateStr)
    ) {
      indexes.push(i);
    }
  }

  if (indexes.length !== 24) {
    throw new Error(
      `Open-Meteo returned ${indexes.length} hourly records for ${dateStr}; 24 are required.`
    );
  }

  const hourly = [];

  let sumTemp = 0;
  let minTemp = Infinity;
  let maxTemp = -Infinity;

  let sumHumidity = 0;
  let sumWind = 0;

  let maxSolar = 0;
  let totalSolar = 0;

  for (
    let hour = 0;
    hour < 24;
    hour++
  ) {

    const index =
      indexes[hour];

    const temp =
      Number(temperatures[index]);

    const humidity =
      Number(humidities[index]);

    const wind =
      Number(winds[index]);

    const radiation =
      Number(solar[index]);

    if (!Number.isFinite(temp)) {
      throw new Error(
        `Open-Meteo returned invalid temperature at hour ${hour}:00.`
      );
    }

    if (!Number.isFinite(humidity)) {
      throw new Error(
        `Open-Meteo returned invalid humidity at hour ${hour}:00.`
      );
    }

    if (!Number.isFinite(wind)) {
      throw new Error(
        `Open-Meteo returned invalid wind speed at hour ${hour}:00.`
      );
    }

    /*
     * Solar radiation can legitimately be 0 at night.
     */
    if (!Number.isFinite(radiation)) {
      throw new Error(
        `Open-Meteo returned invalid solar radiation at hour ${hour}:00.`
      );
    }

    const rh =
      Math.max(
        0,
        Math.min(100, humidity)
      );

    const ws =
      Math.max(0, wind);

    const sw =
      Math.max(0, radiation);

    sumTemp += temp;

    minTemp =
      Math.min(minTemp, temp);

    maxTemp =
      Math.max(maxTemp, temp);

    sumHumidity += rh;

    sumWind += ws;

    maxSolar =
      Math.max(maxSolar, sw);

    totalSolar += sw;

    hourly.push({
      hour,

      time:
        `${String(hour).padStart(2, '0')}:00`,

      temperature:
        Number(temp.toFixed(2)),

      humidity:
        Number(rh.toFixed(1)),

      windSpeed:
        Number(ws.toFixed(2)),

      solarRadiation:
        Number(sw.toFixed(1))
    });
  }

  return {
    source:
      'Open-Meteo Hourly Weather API',

    latitude,
    longitude,
    date: dateStr,

    parameters: [
      'temperature_2m',
      'relative_humidity_2m',
      'wind_speed_10m',
      'shortwave_radiation'
    ],

    community:
      'Open-Meteo Weather Data',

    timeStandard:
      'Local Time',

    summary: {
      avgTemperature:
        Number((sumTemp / 24).toFixed(2)),

      minTemperature:
        Number(minTemp.toFixed(2)),

      maxTemperature:
        Number(maxTemp.toFixed(2)),

      avgHumidity:
        Number((sumHumidity / 24).toFixed(1)),

      avgWindSpeed:
        Number((sumWind / 24).toFixed(2)),

      maxSolarRadiation:
        Number(maxSolar.toFixed(1)),

      totalSolarRadiationWh:
        Number(totalSolar.toFixed(1)),

      recordsCount: 24
    },

    hourly
  };
}


/* ============================================================
   VALIDATION
   ============================================================ */

function validateCoordinates(
  latitude,
  longitude
) {
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new Error(
      'Invalid latitude: must be between -90 and 90 degrees.'
    );
  }

  if (
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error(
      'Invalid longitude: must be between -180 and 180 degrees.'
    );
  }
}


function validateDate(dateStr) {
  if (
    !dateStr ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)
  ) {
    throw new Error(
      'Invalid date format: must be YYYY-MM-DD.'
    );
  }

  const date =
    new Date(`${dateStr}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      'Invalid date provided.'
    );
  }
}


/* ============================================================
   CACHE
   ============================================================ */

async function getCachedWeather(
  latitude,
  longitude,
  dateStr
) {
  const dbStatus =
    db.getStatus();

  const latRound =
    Number(Number(latitude).toFixed(4));

  const lonRound =
    Number(Number(longitude).toFixed(4));

  const cacheKey =
    `${latRound}_${lonRound}_${dateStr}`;

  if (dbStatus.connected) {

    try {

      const rows =
        await db.query(
          `
          SELECT
            hourly_data,
            summary,
            source
          FROM weather_cache
          WHERE
            ROUND(latitude, 4) = ?
            AND ROUND(longitude, 4) = ?
            AND date_str = ?
          `,
          [
            latRound,
            lonRound,
            dateStr
          ]
        );

      if (
        rows &&
        rows.length > 0
      ) {

        return {
          source:
            rows[0].source,

          latitude,
          longitude,
          date: dateStr,

          parameters: [
            'T2M',
            'RH2M',
            'WS10M',
            'ALLSKY_SFC_SW_DWN'
          ],

          summary:
            typeof rows[0].summary === 'string'
              ? JSON.parse(rows[0].summary)
              : rows[0].summary,

          hourly:
            typeof rows[0].hourly_data === 'string'
              ? JSON.parse(rows[0].hourly_data)
              : rows[0].hourly_data
        };
      }

    } catch (err) {

      console.warn(
        '[WeatherService] Cache query error:',
        err.message
      );
    }
  }

  const memStore =
    db.getMemoryStore();

  if (
    memStore.weather_cache.has(
      cacheKey
    )
  ) {
    return memStore.weather_cache.get(
      cacheKey
    );
  }

  return null;
}


async function saveWeatherToCache(
  latitude,
  longitude,
  dateStr,
  result
) {
  const dbStatus =
    db.getStatus();

  const latRound =
    Number(Number(latitude).toFixed(4));

  const lonRound =
    Number(Number(longitude).toFixed(4));

  const cacheKey =
    `${latRound}_${lonRound}_${dateStr}`;

  if (dbStatus.connected) {

    try {

      await db.query(
        `
        INSERT INTO weather_cache
        (
          latitude,
          longitude,
          date_str,
          source,
          hourly_data,
          summary
        )
        VALUES (?, ?, ?, ?, ?, ?)

        ON DUPLICATE KEY UPDATE
          hourly_data = VALUES(hourly_data),
          summary = VALUES(summary),
          source = VALUES(source)
        `,
        [
          latRound,
          lonRound,
          dateStr,
          result.source,
          JSON.stringify(result.hourly),
          JSON.stringify(result.summary)
        ]
      );

    } catch (err) {

      console.warn(
        '[WeatherService] Failed to cache weather in DB:',
        err.message
      );
    }
  }

  const memStore =
    db.getMemoryStore();

  memStore.weather_cache.set(
    cacheKey,
    result
  );
}


module.exports = {
  fetchNasaPowerWeatherData,
  getCachedWeather
};