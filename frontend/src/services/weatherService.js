import { api } from './api';

export async function fetchLiveWeatherData({ latitude, longitude }) {
  if (latitude === undefined || longitude === undefined) {
    throw new Error('Latitude and longitude are required to fetch live weather data.');
  }

  return await api.get('/weather/live', {
    latitude: Number(latitude),
    longitude: Number(longitude)
  });
}

// Kept for historical NASA POWER analysis.
export async function fetchNasaWeatherData({ latitude, longitude, date }) {
  if (latitude === undefined || longitude === undefined || !date) {
    throw new Error('Latitude, longitude, and date are required to fetch NASA POWER data.');
  }

  return await api.get('/weather', {
    latitude,
    longitude,
    date
  });
}
