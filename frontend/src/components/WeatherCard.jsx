import React from 'react';
import { Thermometer, Droplets, Wind, Sun, CheckCircle, Database } from 'lucide-react';

export default function WeatherCard({ weatherData, activeHour = 12, onHourChange }) {
  if (!weatherData || !weatherData.hourly || weatherData.hourly.length === 0) {
    return (
      <div className="card" style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#92400e' }}>
          <Database size={20} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Live Weather Data Required</div>
            <div style={{ fontSize: '0.8rem', color: '#b45309' }}>
              Current weather data must be fetched before thermal simulation and optimization can run.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentHourRecord = weatherData.current ? { ...weatherData.current, time: String(weatherData.current.timestamp).slice(11, 16), solarRadiation: weatherData.current.solarRadiation ?? (weatherData.hourly[activeHour]?.solarRadiation ?? 0) } : (weatherData.hourly[activeHour] || weatherData.hourly[0]);
  const summary = weatherData.summary || {};

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <Sun size={18} color="#f59e0b" />
          <span>Current Weather Conditions</span>
        </div>
        {weatherData.current?.timestamp && (
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Updated: {new Date(weatherData.current.timestamp).toLocaleString()}
          </div>
        )}

        {/* Real data badge */}
        <span className="badge badge-success">
          <CheckCircle size={12} /> LIVE DATA
        </span>
      </div>

      {/* Main 4 Metric Cards */}
      <div className="grid-4" style={{ marginBottom: '1rem' }}>
        {/* Temperature */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
            <Thermometer size={15} color="#0284c7" />
            <span>Temperature (T2M)</span>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
            {currentHourRecord.temperature} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>°C</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.15rem' }}>
            Day Range: {summary.minTemperature}°C to {summary.maxTemperature}°C
          </div>
        </div>

        {/* Humidity */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
            <Droplets size={15} color="#059669" />
            <span>Relative Humidity (RH2M)</span>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
            {currentHourRecord.humidity} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>%</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.15rem' }}>
            Daily Avg: {summary.avgHumidity}%
          </div>
        </div>

        {/* Wind Speed */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
            <Wind size={15} color="#6366f1" />
            <span>Wind Speed (WS10M)</span>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
            {currentHourRecord.windSpeed} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>m/s</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.15rem' }}>
            Daily Mean: {summary.avgWindSpeed} m/s
          </div>
        </div>

        {/* Solar Radiation */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
            <Sun size={15} color="#ea580c" />
            <span>Solar Radiation</span>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
            {currentHourRecord.solarRadiation} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>W/m²</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.15rem' }}>
            Total: {summary.totalSolarRadiationWh} Wh/m²
          </div>
        </div>
      </div>

      {/* Hourly Scrubber & Meta Info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--border-light)'
      }}>
        {/* Hour Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>
            Timeline: {weatherData.hourly[activeHour]?.time || currentHourRecord.time}
          </span>
          <input
            type="range"
            min="0"
            max="23"
            value={activeHour}
            onChange={(e) => onHourChange && onHourChange(parseInt(e.target.value, 10))}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>

        {/* Required Meta Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
          <span style={{ fontWeight: 700, color: '#047857' }}>OPEN-METEO</span>
          <span>•</span>
          <span>{weatherData.timezone || 'Local time'}</span>
          <span>•</span>
          <span style={{ fontWeight: 600, color: '#059669' }}>24 records loaded</span>
        </div>
      </div>
    </div>
  );
}
