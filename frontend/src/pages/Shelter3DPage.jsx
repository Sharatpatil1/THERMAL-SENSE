import React, { useState } from 'react';
import { Box, Layers, Clock, Eye, Info } from 'lucide-react';
import ShelterCanvas from '../3d/ShelterCanvas';

export default function Shelter3DPage({
  shelter,
  simulationResults,
  weatherData,
  setActiveTab
}) {
  const [activeHour, setActiveHour] = useState(12);

  const hasSimulation = Boolean(simulationResults && simulationResults.hourly);
  const currentHourData = hasSimulation ? simulationResults.hourly[activeHour] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>3D Interactive Shelter Studio</h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            High-fidelity 3D structural model with realistic floor, 4 walls, pitched sloped roof, centered door, divided windows, and dynamic thermal surface rendering.
          </p>
        </div>

        {hasSimulation && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="badge badge-success">
              Simulation Active ({currentHourData ? currentHourData.time : '12:00'})
            </span>
          </div>
        )}
      </div>

      {/* Main 3D Canvas Box */}
      <div className="card" style={{ padding: '0.75rem' }}>
        <ShelterCanvas
          shelter={shelter}
          simulationHourly={hasSimulation ? simulationResults.hourly : null}
          activeHour={activeHour}
        />

        {/* 24-Hour Timeline Scrubber when simulation is active */}
        {hasSimulation && (
          <div style={{
            marginTop: '1rem',
            padding: '0.85rem 1rem',
            backgroundColor: '#f8fafc',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}>
                <Clock size={16} color="#0284c7" />
                <span>Simulation Time Scrubber: {currentHourData.time} (Hour {activeHour})</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
                <span>Outdoor: <strong>{currentHourData.outdoorTemp} °C</strong></span>
                <span>Indoor Air: <strong style={{ color: currentHourData.isComfortable ? '#059669' : '#dc2626' }}>{currentHourData.indoorTemp} °C</strong></span>
                <span>Solar: <strong>{currentHourData.solarRadiation} W/m²</strong></span>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="23"
              value={activeHour}
              onChange={(e) => setActiveHour(parseInt(e.target.value, 10))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
        )}
      </div>

      {/* Architectural & Structural Specifications HUD */}
      <div className="grid-3">
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem', color: '#1e3a8a' }}>
            Structural Envelope
          </div>
          <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div>• Dimensions: <strong>{shelter.length}m × {shelter.width}m × {shelter.height}m</strong></div>
            <div>• Floor Footprint: <strong>{(shelter.length * shelter.width).toFixed(1)} m²</strong></div>
            <div>• Air Volume: <strong>{(shelter.length * shelter.width * shelter.height).toFixed(1)} m³</strong></div>
            <div>• Facade Orientation: <strong>{shelter.orientation}</strong></div>
          </div>
        </div>

        <div className="card">
          <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem', color: '#059669' }}>
            Apertures & Fenestration
          </div>
          <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div>• Front Centered Door: <strong>{shelter.doorArea || 1.8} m²</strong> (Insulated)</div>
            <div>• Dual Windows: <strong>{shelter.windowArea || 1.2} m²</strong> total glazing</div>
            <div>• Glazing U-Value: <strong>2.80 W/m²·K</strong> (Double Glazed)</div>
            <div>• Solar Heat Gain Coeff: <strong>0.65 SHGC</strong></div>
          </div>
        </div>

        <div className="card">
          <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem', color: '#d97706' }}>
            3D Visual Controls Guide
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div>• <strong>Exterior View:</strong> Realistic construction textures</div>
            <div>• <strong>Interior View:</strong> Bunk beds, operational desk, occupants</div>
            <div>• <strong>Thermal View:</strong> Surface heat flux gradient</div>
            <div>• <strong>Wireframe:</strong> CAD inspection geometry</div>
          </div>
        </div>
      </div>
    </div>
  );
}
