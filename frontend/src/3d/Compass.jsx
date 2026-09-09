import React from 'react';

export default function Compass({ orientation = 'South' }) {
  let rotationDeg = 0;
  let headingLabel = '180° SOUTH';

  if (orientation === 'North') {
    rotationDeg = 180;
    headingLabel = '000° NORTH';
  } else if (orientation === 'East') {
    rotationDeg = 270;
    headingLabel = '090° EAST';
  } else if (orientation === 'West') {
    rotationDeg = 90;
    headingLabel = '270° WEST';
  } else {
    rotationDeg = 0; // South
    headingLabel = '180° SOUTH';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', pointerEvents: 'auto' }}>
      <div className="compass-box" title={`Facade Orientation: ${orientation} (${headingLabel})`}>
        <div className="compass-label compass-label-n">N</div>
        <div className="compass-label compass-label-e">E</div>
        <div className="compass-label compass-label-s">S</div>
        <div className="compass-label compass-label-w">W</div>

        <div
          className="compass-needle"
          style={{ transform: `rotate(${rotationDeg}deg)` }}
        >
          <div className="compass-needle-north" />
          <div className="compass-needle-south" />
        </div>

        <div style={{
          position: 'absolute',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: '#38bdf8',
          boxShadow: '0 0 6px #38bdf8'
        }} />
      </div>

      <div style={{
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        border: '1px solid #334155',
        borderRadius: '4px',
        padding: '0.15rem 0.4rem',
        color: '#e2e8f0',
        fontSize: '0.62rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        fontFamily: 'var(--font-mono)'
      }}>
        {headingLabel}
      </div>
    </div>
  );
}
