import React, { useState } from 'react';
import { GitCompare, Trophy, Plus, Trash2, CheckCircle2, ArrowRight } from 'lucide-react';
import { runSimulation } from '../services/simulationService';

export default function ComparisonModal({
  shelter,
  selectedMaterials,
  weatherData,
  setActiveTab
}) {
  const [designs, setDesigns] = useState([
    {
      id: 'Design A (Baseline)',
      name: 'Baseline Shelter',
      length: 6,
      width: 4,
      height: 2.8,
      orientation: 'South',
      insulationThicknessMm: 100,
      material: 'Timber + Mineral Wool',
      uValue: 0.28,
      avgIndoorTemp: 14.8,
      comfortPercent: 62.5,
      totalHeatLossKwh: 38.4,
      totalHeatGainKwh: 34.2,
      thermalScore: 68.5
    },
    {
      id: 'Design B (Heavy Insul)',
      name: 'High-Altitude Arctic Variant',
      length: 6,
      width: 4,
      height: 2.8,
      orientation: 'South',
      insulationThicknessMm: 150,
      material: 'Timber + XPS Insulation',
      uValue: 0.19,
      avgIndoorTemp: 18.4,
      comfortPercent: 87.5,
      totalHeatLossKwh: 26.2,
      totalHeatGainKwh: 34.5,
      thermalScore: 89.0
    },
    {
      id: 'Design C (East Facing)',
      name: 'East-Facing Glazing Variant',
      length: 6,
      width: 4,
      height: 2.8,
      orientation: 'East',
      insulationThicknessMm: 150,
      material: 'Timber + XPS Insulation',
      uValue: 0.19,
      avgIndoorTemp: 16.9,
      comfortPercent: 75.0,
      totalHeatLossKwh: 28.1,
      totalHeatGainKwh: 30.1,
      thermalScore: 78.0
    }
  ]);

  // Find design with highest thermalScore
  const bestScore = Math.max(...designs.map(d => d.thermalScore));

  const handleAddCurrentDesign = () => {
    const newDesign = {
      id: `Design ${String.fromCharCode(65 + designs.length)} (Current)`,
      name: `Shelter ${shelter.orientation} ${Math.round((shelter.wallInsulationThicknessM || 0.1) * 1000)}mm`,
      length: shelter.length,
      width: shelter.width,
      height: shelter.height,
      orientation: shelter.orientation,
      insulationThicknessMm: Math.round((shelter.wallInsulationThicknessM || 0.1) * 1000),
      material: `${selectedMaterials.wallStructural ? selectedMaterials.wallStructural.name : 'Timber'} + ${selectedMaterials.wallInsulation ? selectedMaterials.wallInsulation.name : 'Mineral Wool'}`,
      uValue: 0.24,
      avgIndoorTemp: 17.5,
      comfortPercent: 79.0,
      totalHeatLossKwh: 30.5,
      totalHeatGainKwh: 33.0,
      thermalScore: 81.5
    };

    setDesigns(prev => [...prev, newDesign]);
  };

  const handleRemove = (idx) => {
    setDesigns(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Comparative Design Studio</h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Direct side-by-side performance benchmarking across candidate wall assemblies, orientations, and insulation thicknesses.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleAddCurrentDesign}
        >
          <Plus size={14} /> Add Current Configuration
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <GitCompare size={18} color="#0284c7" />
            <span>Design Candidate Comparison Matrix</span>
          </div>
          <span className="badge badge-drdo">Mission Benchmarking</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Design Identifier</th>
                <th>Specifications</th>
                <th>Orientation</th>
                <th>U-Value (W/m²K)</th>
                <th>Avg Indoor Temp</th>
                <th>Heat Loss / Gain</th>
                <th>Comfort % (18-27°C)</th>
                <th>Thermal Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {designs.map((des, idx) => {
                const isBest = des.thermalScore === bestScore;
                return (
                  <tr
                    key={idx}
                    style={{
                      backgroundColor: isBest ? '#f0fdf4' : 'transparent',
                      fontWeight: isBest ? 600 : 400
                    }}
                  >
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{des.id}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{des.name}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.78rem' }}>{des.length}m × {des.width}m × {des.height}m</div>
                      <div style={{ fontSize: '0.72rem', color: '#0284c7' }}>{des.insulationThicknessMm}mm {des.material}</div>
                    </td>
                    <td className="font-mono">{des.orientation}</td>
                    <td className="font-mono">{des.uValue}</td>
                    <td className="font-mono">{des.avgIndoorTemp} °C</td>
                    <td className="font-mono" style={{ fontSize: '0.75rem' }}>
                      <span style={{ color: '#dc2626' }}>{des.totalHeatLossKwh} kWh loss</span>
                      <br />
                      <span style={{ color: '#059669' }}>{des.totalHeatGainKwh} kWh gain</span>
                    </td>
                    <td className="font-mono">
                      <span className={`badge ${des.comfortPercent > 70 ? 'badge-success' : 'badge-warning'}`}>
                        {des.comfortPercent}%
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: isBest ? '#059669' : '#1e3a8a' }}>
                      {des.thermalScore}
                    </td>
                    <td>
                      {isBest ? (
                        <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Trophy size={11} color="#15803d" /> Optimal
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.2rem 0.4rem' }}
                          onClick={() => handleRemove(idx)}
                          title="Remove design from matrix"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
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
