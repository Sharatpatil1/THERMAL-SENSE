import React, { useState } from 'react';
import { Ruler, Compass, Users, Wind, Zap, Thermometer, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function ShelterDesign({
  shelter,
  setShelter,
  setActiveTab,
  climateLoaded = false
}) {
  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    const num = parseFloat(value);
    let err = null;

    if (name === 'length' || name === 'width') {
      if (isNaN(num) || num <= 0) err = 'Must be greater than 0 meters.';
      else if (num < 1.0) err = 'Minimum length/width is 1.0 meter.';
      else if (num > 50) err = 'Maximum dimension is 50 meters.';
    } else if (name === 'height') {
      if (isNaN(num) || num <= 0) err = 'Must be greater than 0 meters.';
      else if (num < 1.8) err = 'Minimum ceiling height is 1.8 meters.';
      else if (num > 10) err = 'Maximum height is 10 meters.';
    } else if (name === 'occupancy') {
      if (isNaN(num) || num < 0) err = 'Occupancy cannot be negative.';
    } else if (name === 'windowArea') {
      if (isNaN(num) || num < 0) err = 'Window area cannot be negative.';
    } else if (name === 'doorArea') {
      if (isNaN(num) || num < 0) err = 'Door area cannot be negative.';
    } else if (name === 'ach') {
      if (isNaN(num) || num <= 0) err = 'ACH must be positive (e.g. 0.3 - 2.0).';
    }

    setErrors(prev => ({ ...prev, [name]: err }));
    return err === null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShelter(prev => ({
      ...prev,
      [name]: value
    }));
    validateField(name, value);
  };

  // Live geometry previews
  const l = Math.max(1, parseFloat(shelter.length) || 6);
  const w = Math.max(1, parseFloat(shelter.width) || 4);
  const h = Math.max(1.8, parseFloat(shelter.height) || 2.8);
  const winA = Math.max(0, parseFloat(shelter.windowArea) || 1.2);
  const doorA = Math.max(0, parseFloat(shelter.doorArea) || 1.8);

  const floorArea = (l * w).toFixed(1);
  const volume = (l * w * h).toFixed(1);
  const grossWallArea = (2 * (l + w) * h).toFixed(1);
  const netWallArea = Math.max(1, (2 * (l + w) * h) - winA - doorA).toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Shelter Design Parameters</h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Configure architectural envelope dimensions, facade orientation, fenestration apertures, and operational thermal internal loads.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setActiveTab('3d')}
          >
            Preview in 3D
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setActiveTab(climateLoaded ? 'simulation' : 'climate')}
          >
            <span>{climateLoaded ? 'Proceed to Simulation' : 'Fetch Climate Data'}</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* Geometry Overview Strip */}
      <div className="card" style={{ backgroundColor: '#f8fafc', padding: '1rem' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Real-time Calculated Geometry Preview
        </div>
        <div className="grid-4">
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Usable Floor Area:</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{floorArea} m²</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Internal Air Volume:</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{volume} m³</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Gross Wall Surface:</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{grossWallArea} m²</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Net Insulated Wall:</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>{netWallArea} m²</div>
          </div>
        </div>
      </div>

      {/* Main Parameters Grid */}
      <div className="grid-2">
        {/* Dimensions & Orientation */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Ruler size={18} color="#0284c7" />
              <span>1. Dimensions & Spatial Orientation</span>
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Length (m)</label>
              <input
                type="number"
                name="length"
                step="0.1"
                min="1"
                className="form-input"
                value={shelter.length}
                onChange={handleChange}
                required
              />
              {errors.length && <div style={{ color: '#dc2626', fontSize: '0.72rem', marginTop: '0.2rem' }}>{errors.length}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Width (m)</label>
              <input
                type="number"
                name="width"
                step="0.1"
                min="1"
                className="form-input"
                value={shelter.width}
                onChange={handleChange}
                required
              />
              {errors.width && <div style={{ color: '#dc2626', fontSize: '0.72rem', marginTop: '0.2rem' }}>{errors.width}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Height (m)</label>
              <input
                type="number"
                name="height"
                step="0.1"
                min="1.8"
                className="form-input"
                value={shelter.height}
                onChange={handleChange}
                required
              />
              {errors.height && <div style={{ color: '#dc2626', fontSize: '0.72rem', marginTop: '0.2rem' }}>{errors.height}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Main Facade Orientation</label>
            <select
              name="orientation"
              className="form-select"
              value={shelter.orientation}
              onChange={handleChange}
            >
              <option value="South">South (Optimal winter solar gain)</option>
              <option value="East">East (Morning sun exposure)</option>
              <option value="West">West (Afternoon solar intensity)</option>
              <option value="North">North (Diffuse daylight only)</option>
            </select>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Window Area (m²)</label>
              <input
                type="number"
                name="windowArea"
                step="0.1"
                min="0"
                className="form-input"
                value={shelter.windowArea}
                onChange={handleChange}
              />
              {errors.windowArea && <div style={{ color: '#dc2626', fontSize: '0.72rem', marginTop: '0.2rem' }}>{errors.windowArea}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Door Area (m²)</label>
              <input
                type="number"
                name="doorArea"
                step="0.1"
                min="0"
                className="form-input"
                value={shelter.doorArea}
                onChange={handleChange}
              />
              {errors.doorArea && <div style={{ color: '#dc2626', fontSize: '0.72rem', marginTop: '0.2rem' }}>{errors.doorArea}</div>}
            </div>
          </div>
        </div>

        {/* Operational Loads & Infiltration */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Zap size={18} color="#ea580c" />
              <span>2. Internal Loads, Infiltration & Comfort</span>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Occupancy (Personnel)</label>
              <input
                type="number"
                name="occupancy"
                min="0"
                className="form-input"
                value={shelter.occupancy}
                onChange={handleChange}
              />
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Assumed 100W sensible/latent heat per person</span>
              {errors.occupancy && <div style={{ color: '#dc2626', fontSize: '0.72rem', marginTop: '0.2rem' }}>{errors.occupancy}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Infiltration (ACH - Air Changes/Hour)</label>
              <input
                type="number"
                name="ach"
                step="0.05"
                min="0.1"
                className="form-input"
                value={shelter.ach}
                onChange={handleChange}
              />
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Field shelters: 0.3 (tight) to 0.8 (drafty)</span>
              {errors.ach && <div style={{ color: '#dc2626', fontSize: '0.72rem', marginTop: '0.2rem' }}>{errors.ach}</div>}
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Equipment Heat Load (W)</label>
              <input
                type="number"
                name="equipmentHeatLoadW"
                min="0"
                className="form-input"
                value={shelter.equipmentHeatLoadW}
                onChange={handleChange}
              />
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Radios, radar units, chargers</span>
            </div>

            <div className="form-group">
              <label className="form-label">Lighting Heat Load (W)</label>
              <input
                type="number"
                name="lightingHeatLoadW"
                min="0"
                className="form-input"
                value={shelter.lightingHeatLoadW}
                onChange={handleChange}
              />
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>LED tactical luminaires</span>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Target Comfort Minimum (°C)</label>
              <input
                type="number"
                name="comfortMin"
                className="form-input"
                value={shelter.comfortMin || 18}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Comfort Maximum (°C)</label>
              <input
                type="number"
                name="comfortMax"
                className="form-input"
                value={shelter.comfortMax || 27}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
