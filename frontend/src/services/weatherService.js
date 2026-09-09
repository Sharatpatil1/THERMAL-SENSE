import { api } from './api';

// ============================================================
// LIVE / FORECAST WEATHER
// Used for:
//   - Today
//   - Tomorrow
// ============================================================

export async function fetchLiveWeatherData({
  latitude,
  longitude,
  date
}) {
  if (
    latitude === undefined ||
    longitude === undefined
  ) {
    throw new Error(
      'Latitude and longitude are required to fetch live weather data.'
    );
  }

  if (!date) {
    throw new Error(
      'Date is required to fetch live or forecast weather data.'
    );
  }

  return await api.get('/weather/live', {
    latitude: Number(latitude),
    longitude: Number(longitude),
    date
  });
}


// ============================================================
// NASA POWER HISTORICAL WEATHER
// Used for:
//   - Past dates
// ============================================================

export async function fetchNasaWeatherData({
  latitude,
  longitude,
  date
}) {
  if (
    latitude === undefined ||
    longitude === undefined ||
    !date
  ) {
    throw new Error(
      'Latitude, longitude, and date are required to fetch NASA POWER data.'
    );
  }

  return await api.get('/weather', {
    latitude: Number(latitude),
    longitude: Number(longitude),
    date
  });
}