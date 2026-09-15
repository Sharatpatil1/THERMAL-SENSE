import { api } from './api';

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
