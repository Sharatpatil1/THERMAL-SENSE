import React, { useState } from 'react';
import { Layers, Shield, Info, Sliders, Check } from 'lucide-react';

export default function Materials({
  materialsList = [],
  selectedMaterials,
  setSelectedMaterials,
  shelter,
  setShelter
}) {
  const [filterCategory, setFilterCategory] = useState('all');

  const filtered = filterCategory === 'all'
    ? materialsList
    : materialsList.filter(m => m.category === filterCategory);

  const categories = [
    { id: 'all', label: 'All Envelope Materials' },
    { id: 'structural', label: 'Structural & Framing' },
    { id: 'insulation', label: 'Thermal Insulation' },
    { id: 'finishing', label: 'Cladding & Finishing' }
  ];

  const handleSelectStructuralWall = (mat) => {
    setSelectedMaterials(prev => ({
      ...prev,
      wallStructural: mat
    }));
  };

  const handleSelectInsulationWall = (mat) => {
    setSelectedMaterials(prev => ({
      ...prev,
      wallInsulation: mat
    }));
  };

  const handleSelectStructuralRoof = (mat) => {
    setSelectedMaterials(prev => ({
      ...prev,
      roofStructural: mat
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Engineering Materials Catalog</h1>
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Standard thermal, mechanical, and logistical properties for forward military field shelters. (Values derived from ASHRAE / ISO standards).
        </p>
      </div>

      {/* Assembly Thickness Sliders Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Sliders size={18} color="#0284c7" />
            <span>Envelope Layer Thickness Specifications</span>
          </div>
          <span className="badge badge-info">Active Assembly</span>
        </div>

        <div className="grid-3">
          <div className="form-group">
            <label className="form-label">
              Wall Insulation Thickness: {Math.round((parseFloat(shelter.wallInsulationThicknessM) || 0.10) * 1000)} mm
            </label>
            <input
              type="range"
              min="0.02"
              max="0.25"
              step="0.01"
              value={shelter.wallInsulationThicknessM || 0.10}
              onChange={(e) => setShelter({ ...shelter, wallInsulationThicknessM: parseFloat(e.target.value) })}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8' }}>
              <span>20mm</span>
              <span>100mm (Standard)</span>
              <span>250mm</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Roof Insulation Thickness: {Math.round((parseFloat(shelter.roofInsulationThicknessM) || 0.10) * 1000)} mm
            </label>
            <input
              type="range"
              min="0.02"
              max="0.25"
              step="0.01"
              value={shelter.roofInsulationThicknessM || 0.10}
              onChange={(e) => setShelter({ ...shelter, roofInsulationThicknessM: parseFloat(e.target.value) })}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8' }}>
              <span>20mm</span>
              <span>100mm</span>
              <span>250mm</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Wall Structural Thickness: {Math.round((parseFloat(shelter.wallThicknessM) || 0.20) * 1000)} mm
            </label>
            <input
              type="range"
              min="0.10"
              max="0.40"
              step="0.02"
              value={shelter.wallThicknessM || 0.20}
              onChange={(e) => setShelter({ ...shelter, wallThicknessM: parseFloat(e.target.value) })}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8' }}>
              <span>100mm</span>
              <span>200mm</span>
              <span>400mm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Material Selection Chips */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat.id}
            type="button"
            className={`btn btn-sm ${filterCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Materials Table & Cards */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Material Name</th>
                <th>Category</th>
                <th>Conductivity (k)</th>
                <th>Density (ρ)</th>
                <th>Specific Heat (Cp)</th>
                <th>Solar Absorptance (α)</th>
                <th>Field Notes & Assign</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(mat => {
                const isWallStruct = selectedMaterials.wallStructural && selectedMaterials.wallStructural.id === mat.id;
                const isWallInsul = selectedMaterials.wallInsulation && selectedMaterials.wallInsulation.id === mat.id;

                return (
                  <tr key={mat.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{mat.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{mat.description}</div>
                    </td>
                    <td>
                      <span className="badge badge-drdo" style={{ textTransform: 'capitalize' }}>
                        {mat.category}
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontWeight: 700, color: '#0284c7' }}>
                      {mat.thermal_conductivity} <span style={{ fontSize: '0.7rem', color: '#64748b' }}>W/m·K</span>
                    </td>
                    <td className="font-mono">
                      {mat.density} <span style={{ fontSize: '0.7rem', color: '#64748b' }}>kg/m³</span>
                    </td>
                    <td className="font-mono">
                      {mat.specific_heat} <span style={{ fontSize: '0.7rem', color: '#64748b' }}>J/kg·K</span>
                    </td>
                    <td className="font-mono">
                      {mat.solar_absorptance}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.72rem', color: '#475569', marginBottom: '0.4rem' }}>
                        {mat.practical_notes}
                      </div>

                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {mat.category === 'structural' && (
                          <button
                            type="button"
                            className={`btn btn-sm ${isWallStruct ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => handleSelectStructuralWall(mat)}
                          >
                            {isWallStruct && <Check size={12} />} Set Wall Struct
                          </button>
                        )}
                        {mat.category === 'insulation' && (
                          <button
                            type="button"
                            className={`btn btn-sm ${isWallInsul ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => handleSelectInsulationWall(mat)}
                          >
                            {isWallInsul && <Check size={12} />} Set Insulation
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
