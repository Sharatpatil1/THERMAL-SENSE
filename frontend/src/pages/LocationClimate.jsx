import React, { useState } from 'react';
import {
  MapPin,
  RefreshCw,
  AlertTriangle,
  Database,
  ArrowRight
} from 'lucide-react';
import { fetchNasaWeatherData } from '../services/weatherService';
import WeatherCard from '../components/WeatherCard';

function getTomorrowDate() {
  const date = new Date();

  date.setDate(date.getDate() + 1);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export default function LocationClimate({
  locationConfig,
  setLocationConfig,
  weatherData,
  setWeatherData,
  setActiveTab
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeHour, setActiveHour] = useState(12);

  const maxDate = getTomorrowDate();

  const presets = [
    {
      name: 'Leh, Ladakh, India (Default)',
      lat: 34.1526,
      lon: 77.5771,
      desc: 'Extreme Cold High-Altitude (3500m)'
    },
    {
      name: 'Siachen Glacier Base Camp',
      lat: 35.2,
      lon: 77.12,
      desc: 'Ultra-cold arctic conditions'
    },
    {
      name: 'Tawang, Arunachal Pradesh',
      lat: 27.5861,
      lon: 91.8594,
      desc: 'Eastern alpine border outpost'
    },
    {
      name: 'Jaisalmer Sector, Rajasthan',
      lat: 26.9157,
      lon: 70.9083,
      desc: 'Hot-dry desert border terrain'
    }
  ];

  const handleApplyPreset = (preset) => {
    setLocationConfig((prev) => ({
      ...prev,
      locationName: preset.name,
      latitude: preset.lat,
      longitude: preset.lon
    }));

    setError(null);
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;

    if (selectedDate > maxDate) {
      setError(
        `Please select a date up to tomorrow (${maxDate}). Future dates beyond tomorrow are not allowed.`
      );
      return;
    }

    setError(null);

    setLocationConfig({
      ...locationConfig,
      date: selectedDate
    });
  };

  const handleFetchWeather = async (e) => {
    if (e) e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const lat = parseFloat(locationConfig.latitude);
      const lon = parseFloat(locationConfig.longitude);
      const selectedDate = locationConfig.date;

      if (isNaN(lat) || lat < -90 || lat > 90) {
        throw new Error(
          'Latitude must be a valid number between -90 and 90 degrees.'
        );
      }

      if (isNaN(lon) || lon < -180 || lon > 180) {
        throw new Error(
          'Longitude must be a valid number between -180 and 180 degrees.'
        );
      }

      if (!selectedDate) {
        throw new Error('Please select a valid date.');
      }

      if (selectedDate > maxDate) {
        throw new Error(
          `Dates beyond tomorrow are not allowed. Maximum selectable date is ${maxDate}.`
        );
      }

      const res = await fetchNasaWeatherData({
        latitude: lat,
        longitude: lon,
        date: selectedDate
      });

      setWeatherData(res);
    } catch (err) {
      console.error('NASA fetch error:', err);

      setError(
        err.message ||
          'Failed to retrieve NASA POWER climate data.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}
    >
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#0f172a'
            }}
          >
            Location & Climate Analysis
          </h1>

          <p
            style={{
              fontSize: '0.85rem',
              color: '#64748b'
            }}
          >
            Fetch official 24-hour hourly climate datasets directly from NASA
            POWER for mission-specific geographic coordinates.
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
        <div
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#475569',
            textTransform: 'uppercase',
            marginBottom: '0.6rem'
          }}
        >
          Tactical Station Presets (Indian Strategic Sectors)
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}
        >
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleApplyPreset(p)}
              style={{
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start'
              }}
            >
              <span style={{ fontWeight: 600 }}>
                {p.name}
              </span>

              <span
                style={{
                  fontSize: '0.68rem',
                  color: '#64748b'
                }}
              >
                {p.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Inputs Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <MapPin size={18} color="#0284c7" />
            <span>
              Geographic Coordinates & Historical Date
            </span>
          </div>

          <span className="badge badge-drdo">
            NASA POWER SB (LST)
          </span>
        </div>

        <form onSubmit={handleFetchWeather}>
          <div className="grid-4">
            {/* Location Name */}
            <div className="form-group">
              <label className="form-label">
                Station / Location Name
              </label>

              <input
                type="text"
                className="form-input"
                value={locationConfig.locationName}
                onChange={(e) =>
                  setLocationConfig({
                    ...locationConfig,
                    locationName: e.target.value
                  })
                }
                placeholder="e.g. Leh, Ladakh, India"
                required
              />
            </div>

            {/* Latitude */}
            <div className="form-group">
              <label className="form-label">
                Latitude (°N/S, -90 to +90)
              </label>

              <input
                type="number"
                step="0.0001"
                min="-90"
                max="90"
                className="form-input"
                value={locationConfig.latitude}
                onChange={(e) =>
                  setLocationConfig({
                    ...locationConfig,
                    latitude: e.target.value
                  })
                }
                required
              />
            </div>

            {/* Longitude */}
            <div className="form-group">
              <label className="form-label">
                Longitude (°E/W, -180 to +180)
              </label>

              <input
                type="number"
                step="0.0001"
                min="-180"
                max="180"
                className="form-input"
                value={locationConfig.longitude}
                onChange={(e) =>
                  setLocationConfig({
                    ...locationConfig,
                    longitude: e.target.value
                  })
                }
                required
              />
            </div>

            {/* Date */}
            <div className="form-group">
              <label className="form-label">
                Observation Date (YYYY-MM-DD)
              </label>

              <input
                type="date"
                max={maxDate}
                className="form-input"
                value={locationConfig.date}
                onChange={handleDateChange}
                required
              />

              <div
                style={{
                  fontSize: '0.68rem',
                  color: '#64748b',
                  marginTop: '0.35rem'
                }}
              >
                Previous dates, today, and tomorrow are allowed.
                Maximum: {maxDate}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '0.5rem'
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                color: '#64748b'
              }}
            >
              * Data fetched: Surface Air Temp (T2M), Relative
              Humidity (RH2M), Wind Speed (WS10M), All-Sky
              Downward Solar (ALLSKY_SFC_SW_DWN).
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              <RefreshCw
                size={15}
                className={loading ? 'animate-spin' : ''}
              />

              <span>
                {loading
                  ? 'Fetching NASA POWER data...'
                  : 'Fetch NASA POWER Data'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Error Alert Box */}
      {error && (
        <div className="alert alert-danger">
          <AlertTriangle size={20} />

          <div>
            <div
              style={{
                fontWeight: 700
              }}
            >
              NASA Climate Retrieval Failed
            </div>

            <div
              style={{
                fontSize: '0.82rem',
                marginTop: '0.15rem'
              }}
            >
              {error}
            </div>
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
              <Database
                size={18}
                color="#059669"
              />

              <span>
                NASA POWER 24-Hour Observation Log (
                {weatherData.date})
              </span>
            </div>

            <span className="badge badge-success">
              24 Verified Hourly Records
            </span>
          </div>

          <div
            style={{
              overflowX: 'auto',
              maxHeight: '350px'
            }}
          >
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Hour (LST)</th>
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
                      backgroundColor:
                        row.hour === activeHour
                          ? '#e0f2fe'
                          : 'transparent',

                      fontWeight:
                        row.hour === activeHour
                          ? 700
                          : 400
                    }}
                  >
                    <td className="font-mono">
                      {row.time}
                    </td>

                    <td
                      className="font-mono"
                      style={{
                        color:
                          row.temperature < 0
                            ? '#0284c7'
                            : '#ea580c'
                      }}
                    >
                      {row.temperature} °C
                    </td>

                    <td className="font-mono">
                      {row.humidity} %
                    </td>

                    <td className="font-mono">
                      {row.windSpeed} m/s
                    </td>

                    <td className="font-mono">
                      {row.solarRadiation} W/m²
                    </td>
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