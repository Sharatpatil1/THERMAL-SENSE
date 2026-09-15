import React from 'react';
import { Shield, Menu } from 'lucide-react';

export default function Header({
  toggleMobileSidebar,
  climateLoaded = false,
  simulationDone = false
}) {
  return (
    <header
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-light)',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}
    >
      {/* LEFT: ShelterX Logo & Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={toggleMobileSidebar}
          style={{ display: 'none' }}
          id="mobile-sidebar-toggle"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={18} />
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          {/* Circular ShelterX Logo */}
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#0b1523',
              border: '2px solid #38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1.05rem',
              letterSpacing: '-0.02em',
              boxShadow: '0 2px 5px rgba(11, 21, 35, 0.3)'
            }}
          >
            SX
          </div>

          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: '1.15rem',
                color: '#0b1523',
                letterSpacing: '-0.03em'
              }}
            >
              SHELTERX
            </div>

            <div
              style={{
                fontSize: '0.72rem',
                color: '#64748b',
                fontWeight: 500
              }}
            >
              Smart Shelters. Safer Missions.
            </div>
          </div>
        </div>
      </div>

      {/* CENTER: Mission Banner */}
      <div
        style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <div
          style={{
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#1e3a8a',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Shield size={14} color="#1e3a8a" />
          AI-Powered Thermal Comfort & Shelter Optimization
        </div>

        <div
          style={{
            fontSize: '0.72rem',
            color: '#475569',
            fontWeight: 600
          }}
        >
          for DRDO | Indian Armed Forces
        </div>
      </div>

      {/* RIGHT: DRDO & Disclaimer */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#b91c1c'
            }}
          >
            भारत सरकार
          </span>

          <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>
            |
          </span>

          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#0b1523'
            }}
          >
            DRDO
          </span>

          <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>
            |
          </span>

          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              color: '#475569'
            }}
          >
            Ministry of Defence
          </span>
        </div>

        <div
          style={{
            fontSize: '0.66rem',
            color: '#64748b',
            fontStyle: 'italic',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
        >
          <span>Decision-support prototype (SIH26051)</span>
        </div>
      </div>
    </header>
  );
}