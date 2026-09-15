import React from 'react';
import {
  Home,
  CloudSun,
  Ruler,
  Layers,
  Box,
  LineChart,
  Sparkles,
  FileText,
  GitCompare,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function Sidebar({
  activeTab = 'home',
  setActiveTab,
  climateLoaded = false,
  simulationDone = false,
  isOpen = true
}) {
  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'climate', label: 'Location & Climate', icon: CloudSun, badge: climateLoaded ? 'Loaded' : 'Required' },
    { id: 'design', label: 'Shelter Design', icon: Ruler },
    { id: 'materials', label: 'Materials Catalog', icon: Layers },
    { id: '3d', label: '3D Visualization', icon: Box },
    { id: 'simulation', label: 'Thermal Simulation', icon: LineChart, badge: simulationDone ? 'Done' : null },
    { id: 'optimization', label: 'Optimization', icon: Sparkles },
    { id: 'comparison', label: 'Compare Designs', icon: GitCompare },
    { id: 'reports', label: 'Saved Reports', icon: FileText }
  ];

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: 'var(--sidebar-bg)',
        color: 'var(--sidebar-text)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        borderRight: '1px solid #1e293b',
        userSelect: 'none'
      }}
    >
      {/* Sidebar Top / Status Section */}
      <div
        style={{
          padding: '1.25rem 1.25rem 0.75rem 1.25rem',
          borderBottom: '1px solid #1e293b'
        }}
      >
        <div
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: '#64748b',
            letterSpacing: '0.06em',
            marginBottom: '0.5rem'
          }}
        >
          SYSTEM PIPELINE
        </div>

        {/* Climate Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.4rem',
            fontSize: '0.75rem'
          }}
        >
          <span style={{ color: '#cbd5e1' }}>NASA Climate:</span>

          {climateLoaded ? (
            <span
              style={{
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontWeight: 600
              }}
            >
              <CheckCircle size={12} /> Ready
            </span>
          ) : (
            <span
              style={{
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontWeight: 600
              }}
            >
              <AlertCircle size={12} /> Required
            </span>
          )}
        </div>

        {/* Simulation Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem'
          }}
        >
          <span style={{ color: '#cbd5e1' }}>Simulation:</span>

          {simulationDone ? (
            <span
              style={{
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontWeight: 600
              }}
            >
              <CheckCircle size={12} /> Solved
            </span>
          ) : (
            <span
              style={{
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}
            >
              Pending
            </span>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav
        style={{
          flex: 1,
          padding: '0.75rem 0.65rem',
          overflowY: 'auto'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
          }}
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isActive
                    ? 'var(--sidebar-active)'
                    : 'transparent',
                  color: isActive
                    ? 'var(--sidebar-text-active)'
                    : 'var(--sidebar-text)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.84rem',
                  fontWeight: isActive ? 600 : 500,
                  textAlign: 'left',
                  transition:
                    'background-color 0.15s ease, color 0.15s ease'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem'
                  }}
                >
                  <Icon
                    size={17}
                    color={isActive ? '#38bdf8' : 'currentColor'}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      fontWeight: 700,
                      backgroundColor:
                        item.badge === 'Loaded' || item.badge === 'Done'
                          ? '#064e3b'
                          : '#78350f',
                      color:
                        item.badge === 'Loaded' || item.badge === 'Done'
                          ? '#6ee7b7'
                          : '#fde68a'
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Bottom Version / Prototype Info */}
      <div
        style={{
          padding: '0.85rem 1.25rem',
          borderTop: '1px solid #1e293b',
          fontSize: '0.7rem',
          color: '#64748b'
        }}
      >
        <div style={{ fontWeight: 600, color: '#94a3b8' }}>
          ShelterX v1.0
        </div>
        <div>SIH26051 DRDO Prototype</div>
      </div>
    </aside>
  );
}