import React from 'react';

export default function TemperatureLegend({ visible = true }) {
  if (!visible) return null;

  return (
    <div className="temp-legend-container" style={{ pointerEvents: 'auto' }}>
      <div className="temp-legend-title">Thermal Gradient</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div className="temp-legend-bar" />
        <div className="temp-legend-ticks">
          <div className="temp-legend-item">
            <span style={{ color: '#ef4444' }}>●</span> 35 °C <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>(Peak)</span>
          </div>
          <div className="temp-legend-item">
            <span style={{ color: '#eab308' }}>●</span> 20 °C <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>(Comfort)</span>
          </div>
          <div className="temp-legend-item">
            <span style={{ color: '#22c55e' }}>●</span> 5 °C <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>(Chilled)</span>
          </div>
          <div className="temp-legend-item">
            <span style={{ color: '#3b82f6' }}>●</span> -10 °C <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>(Sub-Zero)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
