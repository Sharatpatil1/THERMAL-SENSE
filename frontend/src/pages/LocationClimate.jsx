import React, { useEffect, useState } from 'react';
import { CloudSun, MapPin, Calendar, RefreshCw, AlertTriangle, CheckCircle, Database, ArrowRight } from 'lucide-react';
import { fetchLiveWeatherData } from '../services/weatherService';
import WeatherCard from '../components/WeatherCard';

export default function LocationClimate({
  locationConfig,
  setLocationConfig,
  weatherData,
  setWeatherData,
  setActiveTab
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeHour, setActiveHour] = useState(new Date().getHours());

  const presets = [
    { name: 'Leh, Ladakh, India (Default)', lat: 34.1526, lon: 77.5771, desc: 'Extreme Cold High-Altitude (3500m)' },
    { name: 'Siachen Glacier Base Camp', lat: 35.2000, lon: 77.1200, desc: 'Ultra-cold arctic conditions' },
    { name: 'Tawang, Arunachal Pradesh', lat: 27.5861, lon: 91.8594, desc: 'Eastern alpine border outpost' },
    { name: 'Jaisalmer Sector, Rajasthan', lat: 26.9157, lon: 70.9083, desc: 'Hot-dry desert border terrain' }
  ];

  const handleApplyPreset = (preset) => {
    setLocationConfig(prev => ({
      ...prev,
      locationName: preset.name,
      latitude: preset.lat,
      longitude: preset.lon
    }));
    setError(null);
  };

  const handleFetchWeather = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const lat = parseFloat(locationConfig.latitude);
      const lon = parseFloat(locationConfig.longitude);

      if (isNaN(lat) || lat < -90 || lat > 90) {
        throw new Error('Latitude must be a valid number between -90 and 90 degrees.');
      }
      if (isNaN(lon) || lon < -180 || lon > 180) {
        throw new Error('Longitude must be a valid number between -180 and 180 degrees.');
      }

      const res = await fetchLiveWeatherData({ latitude: lat, longitude: lon });
      setWeatherData(res);

      const currentHour = Number(String(res.current?.timestamp || '').slice(11, 13));
      if (Number.isInteger(currentHour) && currentHour >= 0 && currentHour <= 23) {
        setActiveHour(currentHour);
      }
    } catch (err) {
      console.error('Live weather fetch error:', err);
      setError(err.message || 'Failed to retrieve live weather data.');
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch immediately when the Location & Climate page opens, then refresh every 5 minutes.
  useEffect(() => {
    handleFetchWeather();
    const timer = setInterval(() => handleFetchWeather(), 5 * 60 * 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationConfig.latitude, locationConfig.longitude]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Location & Climate Analysis</h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Fetch current weather conditions and a 24-hour weather window for the selected mission coordinates.
          </p>
        </div>

        {weatherData && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setActiveTab('design')}
          >
            <span>Proceed to Shelter Design</span>
            <ArrowRight size={15} />
          </button>
        )}
      </div>

      {/* Preset Quick Selection */}
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
          Tactical Station Presets
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleApplyPreset(p)}
              style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
            >
              <span style={{ fontWeight: 600 }}>{p.name}</span>
              <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{p.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Inputs Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <MapPin size={18} color="#0284c7" />
            <span>Live Geographic Weather</span>
          </div>
          <span className="badge badge-success">LIVE WEATHER</span>
        </div>

        <form onSubmit={handleFetchWeather}>
          <div className="grid-4">
            <div className="form-group">
              <label className="form-label">Station / Location Name</label>
              <input
                type="text"
                className="form-input"
                value={locationConfig.locationName}
                onChange={(e) => setLocationConfig({ ...locationConfig, locationName: e.target.value })}
                placeholder="e.g. Leh, Ladakh, India"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Latitude (°N/S, -90 to +90)</label>
              <input
                type="number"
                step="0.0001"
                min="-90"
                max="90"
                className="form-input"
                value={locationConfig.latitude}
                onChange={(e) => setLocationConfig({ ...locationConfig, latitude: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Longitude (°E/W, -180 to +180)</label>
              <input
                type="number"
                step="0.0001"
                min="-180"
                max="180"
                className="form-input"
                value={locationConfig.longitude}
                onChange={(e) => setLocationConfig({ ...locationConfig, longitude: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Data Mode</label>
              <div className="form-input" style={{ display: 'flex', alignItems: 'center', color: '#047857', fontWeight: 700 }}>
                LIVE / CURRENT
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              * Current temperature, humidity and wind are fetched from Open-Meteo current conditions. Solar radiation uses satellite instantaneous data when available; the 24-hour simulation series uses the live weather model. No synthetic fallback is used.
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Fetching live weather...' : 'Refresh Live Weather'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Error Alert Box */}
      {error && (
        <div className="alert alert-danger">
          <AlertTriangle size={20} />
          <div>
            <div style={{ fontWeight: 700 }}>Live Weather Retrieval Failed</div>
            <div style={{ fontSize: '0.82rem', marginTop: '0.15rem' }}>{error}</div>
          </div>
        </div>
      )}

      {/* Live Weather Card */}
      <WeatherCard
        weatherData={weatherData}
        activeHour={activeHour}
        onHourChange={setActiveHour}
      />

      {/* Hourly Data Log Table */}
      {weatherData && weatherData.hourly && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Database size={18} color="#059669" />
              <span>Live 24-Hour Weather Data ({weatherData.date})</span>
            </div>
            <span className="badge badge-success">24 Hourly Records</span>
          </div>

          <div style={{ overflowX: 'auto', maxHeight: '350px' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Local Time</th>
                  <th>Air Temp (T2M, °C)</th>
                  <th>Relative Humidity (%)</th>
                  <th>Wind Speed (10m, m/s)</th>
                  <th>Solar Irradiance (W/m²)</th>
                </tr>
              </thead>
              <tbody>
                {weatherData.hourly.map((row) => (
                  <tr
                    key={row.hour}
                    style={{
                      backgroundColor: row.hour === activeHour ? '#e0f2fe' : 'transparent',
                      fontWeight: row.hour === activeHour ? 700 : 400
                    }}
                  >
                    <td className="font-mono">{row.time}</td>
                    <td className="font-mono" style={{ color: row.temperature < 0 ? '#0284c7' : '#ea580c' }}>
                      {row.temperature} °C
                    </td>
                    <td className="font-mono">{row.humidity} %</td>
                    <td className="font-mono">{row.windSpeed} m/s</td>
                    <td className="font-mono">{row.solarRadiation} W/m²</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
