import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Calendar,
  RefreshCw,
  AlertTriangle,
  Database,
  ArrowRight
} from 'lucide-react';

import {
  fetchLiveWeatherData,
  fetchNasaWeatherData
} from '../services/weatherService';

import WeatherCard from '../components/WeatherCard';

export default function LocationClimate({
  locationConfig,
  setLocationConfig,
  weatherData,
  setWeatherData,
  setActiveTab
}) {
  const getLocalDate = (offsetDays = 0) => {
    const date = new Date();

    date.setDate(date.getDate() + offsetDays);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const today = getLocalDate(0);
  const tomorrow = getLocalDate(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [activeHour, setActiveHour] = useState(
    new Date().getHours()
  );

  const [selectedDate, setSelectedDate] = useState(
    locationConfig.selectedDate || today
  );

  const [dataMode, setDataMode] = useState(
    selectedDate < today
      ? 'HISTORICAL'
      : selectedDate === tomorrow
        ? 'FORECAST'
        : 'LIVE / CURRENT'
  );

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

  const getModeForDate = (date) => {
    if (date < today) {
      return 'HISTORICAL';
    }

    if (date === today) {
      return 'LIVE / CURRENT';
    }

    if (date === tomorrow) {
      return 'FORECAST';
    }

    return 'UNAVAILABLE';
  };

  const handleDateChange = (e) => {
    const date = e.target.value;

    if (!date) {
      return;
    }

    if (date > tomorrow) {
      setError(
        'Future climate data beyond tomorrow is not available.'
      );
      return;
    }

    setSelectedDate(date);

    setLocationConfig(prev => ({
      ...prev,
      selectedDate: date
    }));

    setDataMode(getModeForDate(date));
    setWeatherData(null);
    setError(null);

    // For today start with current hour.
    // For historical/tomorrow the fetched dataset will determine the active hour.
    if (date === today) {
      setActiveHour(new Date().getHours());
    } else {
      setActiveHour(0);
    }
  };

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
    if (e) {
      e.preventDefault();
    }

    setLoading(true);
    setError(null);

    try {
      const lat = parseFloat(locationConfig.latitude);
      const lon = parseFloat(locationConfig.longitude);

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

      if (selectedDate > tomorrow) {
        throw new Error(
          'Climate data is available only for past dates, today, and tomorrow.'
        );
      }

      let res;

      // ------------------------------------------------------
      // PAST DATE → NASA POWER HISTORICAL
      // ------------------------------------------------------

      if (selectedDate < today) {
        setDataMode('HISTORICAL');

        res = await fetchNasaWeatherData({
          latitude: lat,
          longitude: lon,
          date: selectedDate
        });
      }

      // ------------------------------------------------------
      // TODAY / TOMORROW → OPEN-METEO LIVE / FORECAST
      // ------------------------------------------------------

      else {
        setDataMode(
          selectedDate === today
            ? 'LIVE / CURRENT'
            : 'FORECAST'
        );

        res = await fetchLiveWeatherData({
          latitude: lat,
          longitude: lon,
          date: selectedDate
        });
      }

      setWeatherData(res);

      // ------------------------------------------------------
      // SELECT ACTIVE HOUR
      // ------------------------------------------------------

      if (selectedDate === today) {
        const currentHour = Number(
          String(
            res.current?.timestamp || ''
          ).slice(11, 13)
        );

        if (
          Number.isInteger(currentHour) &&
          currentHour >= 0 &&
          currentHour <= 23
        ) {
          setActiveHour(currentHour);
        }
      } else {
        setActiveHour(0);
      }
    } catch (err) {
      console.error(
        'Climate weather fetch error:',
        err
      );

      setError(
        err.message ||
          'Failed to retrieve climate data.'
      );

      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // INITIAL FETCH
  // ----------------------------------------------------------

  useEffect(() => {
    if (!locationConfig.selectedDate) {
      setLocationConfig(prev => ({
        ...prev,
        selectedDate: today
      }));
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------------
  // AUTO REFRESH ONLY FOR TODAY
  // ----------------------------------------------------------

  useEffect(() => {
    if (selectedDate !== today) {
      return undefined;
    }

    handleFetchWeather();

    // Cache on backend prevents every refresh from hitting provider.
    const timer = setInterval(
      () => handleFetchWeather(),
      10 * 60 * 1000
    );

    return () => clearInterval(timer);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    locationConfig.latitude,
    locationConfig.longitude,
    selectedDate
  ]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}
    >
      {/* ====================================================
          PAGE HEADER
      ==================================================== */}

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
            Analyze historical, current, and next-day
            climate conditions for the selected mission
            coordinates.
          </p>
        </div>

        {weatherData && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              setActiveTab('design')
            }
          >
            <span>
              Proceed to Shelter Design
            </span>

            <ArrowRight size={15} />
          </button>
        )}
      </div>

      {/* ====================================================
          PRESET QUICK SELECTION
      ==================================================== */}

      <div
        className="card"
        style={{
          padding: '1rem'
        }}
      >
        <div
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#475569',
            textTransform: 'uppercase',
            marginBottom: '0.6rem'
          }}
        >
          Tactical Station Presets
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
              onClick={() =>
                handleApplyPreset(p)
              }
              style={{
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start'
              }}
            >
              <span
                style={{
                  fontWeight: 600
                }}
              >
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

      {/* ====================================================
          CLIMATE INPUT CARD
      ==================================================== */}

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <MapPin
              size={18}
              color="#0284c7"
            />

            <span>
              Geographic Climate Analysis
            </span>
          </div>

          <span
            className={
              dataMode === 'HISTORICAL'
                ? 'badge badge-warning'
                : dataMode === 'FORECAST'
                  ? 'badge badge-info'
                  : 'badge badge-success'
            }
          >
            {dataMode}
          </span>
        </div>

        <form onSubmit={handleFetchWeather}>
          <div className="grid-4">

            {/* LOCATION */}

            <div className="form-group">
              <label className="form-label">
                Station / Location Name
              </label>

              <input
                type="text"
                className="form-input"
                value={
                  locationConfig.locationName
                }
                onChange={(e) =>
                  setLocationConfig({
                    ...locationConfig,
                    locationName:
                      e.target.value
                  })
                }
                placeholder="e.g. Leh, Ladakh, India"
                required
              />
            </div>

            {/* LATITUDE */}

            <div className="form-group">
              <label className="form-label">
                Latitude (°N/S)
              </label>

              <input
                type="number"
                step="0.0001"
                min="-90"
                max="90"
                className="form-input"
                value={
                  locationConfig.latitude
                }
                onChange={(e) =>
                  setLocationConfig({
                    ...locationConfig,
                    latitude:
                      e.target.value
                  })
                }
                required
              />
            </div>

            {/* LONGITUDE */}

            <div className="form-group">
              <label className="form-label">
                Longitude (°E/W)
              </label>

              <input
                type="number"
                step="0.0001"
                min="-180"
                max="180"
                className="form-input"
                value={
                  locationConfig.longitude
                }
                onChange={(e) =>
                  setLocationConfig({
                    ...locationConfig,
                    longitude:
                      e.target.value
                  })
                }
                required
              />
            </div>

            {/* DATE */}

            <div className="form-group">
              <label className="form-label">
                <Calendar
                  size={14}
                  style={{
                    verticalAlign: 'middle',
                    marginRight: '0.3rem'
                  }}
                />

                Climate Date
              </label>

              <input
                type="date"
                className="form-input"
                value={selectedDate}
                min="2000-01-01"
                max={tomorrow}
                onChange={handleDateChange}
                required
              />

              <div
                style={{
                  fontSize: '0.68rem',
                  color: '#64748b',
                  marginTop: '0.3rem'
                }}
              >
                Past dates, today and tomorrow are
                available. Future dates beyond tomorrow
                are disabled.
              </div>
            </div>
          </div>

          {/* ==================================================
              MODE INFORMATION
          ================================================== */}

          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '0.78rem',
              color: '#475569'
            }}
          >
            {selectedDate < today && (
              <>
                <strong>
                  Historical Climate:
                </strong>{' '}
                NASA POWER historical weather data
                will be used for this date.
              </>
            )}

            {selectedDate === today && (
              <>
                <strong>
                  Live Weather:
                </strong>{' '}
                Current Open-Meteo conditions and
                hourly weather data will be used.
              </>
            )}

            {selectedDate === tomorrow && (
              <>
                <strong>
                  Tomorrow Forecast:
                </strong>{' '}
                Open-Meteo forecast weather data will
                be used for the selected date.
              </>
            )}
          </div>

          {/* ==================================================
              ACTION ROW
          ================================================== */}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '0.75rem',
              gap: '1rem',
              flexWrap: 'wrap'
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                color: '#64748b'
              }}
            >
              {selectedDate < today &&
                'Historical data source: NASA POWER.'}

              {selectedDate === today &&
                'Current conditions: Open-Meteo. Satellite solar radiation is used when available.'}

              {selectedDate === tomorrow &&
                'Forecast source: Open-Meteo. Forecast values are model-based.'}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              <RefreshCw
                size={15}
                className={
                  loading
                    ? 'animate-spin'
                    : ''
                }
              />

              <span>
                {loading
                  ? 'Fetching climate data...'
                  : selectedDate < today
                    ? 'Fetch Historical Climate'
                    : selectedDate === tomorrow
                      ? 'Fetch Tomorrow Forecast'
                      : 'Refresh Live Weather'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <div className="alert alert-danger">
          <AlertTriangle size={20} />

          <div>
            <div
              style={{
                fontWeight: 700
              }}
            >
              Climate Data Retrieval Failed
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

      {/* ====================================================
          WEATHER CARD
      ==================================================== */}

      <WeatherCard
        weatherData={weatherData}
        activeHour={activeHour}
        onHourChange={setActiveHour}
      />

      {/* ====================================================
          HOURLY DATA TABLE
      ==================================================== */}

      {weatherData &&
        weatherData.hourly && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Database
                  size={18}
                  color="#059669"
                />

                <span>
                  {dataMode === 'HISTORICAL'
                    ? 'Historical'
                    : dataMode === 'FORECAST'
                      ? 'Forecast'
                      : 'Live'}{' '}
                  24-Hour Weather Data (
                  {weatherData.date ||
                    selectedDate}
                  )
                </span>
              </div>

              <span className="badge badge-success">
                24 Hourly Records
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
                    <th>
                      Local Time
                    </th>

                    <th>
                      Air Temp (°C)
                    </th>

                    <th>
                      Relative Humidity (%)
                    </th>

                    <th>
                      Wind Speed (m/s)
                    </th>

                    <th>
                      Solar Irradiance (W/m²)
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {weatherData.hourly.map(
                    (row) => (
                      <tr
                        key={row.hour}
                        style={{
                          backgroundColor:
                            row.hour ===
                            activeHour
                              ? '#e0f2fe'
                              : 'transparent',

                          fontWeight:
                            row.hour ===
                            activeHour
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
                              row.temperature <
                              0
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
                          {row.solarRadiation}{' '}
                          W/m²
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  );
}