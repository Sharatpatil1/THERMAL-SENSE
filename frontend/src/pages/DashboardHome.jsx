import React from 'react';
import {
  CloudSun,
  Ruler,
  LineChart,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Thermometer,
  Layers,
  FileText
} from 'lucide-react';
import ShelterCanvas from '../3d/ShelterCanvas';

export default function DashboardHome({
  setActiveTab,
  weatherData,
  shelter,
  simulationResults,
  optimizationResults
}) {
  const isClimateReady = Boolean(weatherData && weatherData.hourly);
  const isSimReady = Boolean(simulationResults && simulationResults.summary);
  const isOptReady = Boolean(optimizationResults && optimizationResults.topRankedCandidates);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #0b1523 0%, #1e293b 100%)',
        color: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem 2.5rem',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div style={{ maxWidth: '650px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: '#38bdf8',
            fontSize: '0.75rem',
            fontWeight: 700,
            marginBottom: '0.75rem',
            letterSpacing: '0.04em'
          }}>
            <ShieldCheck size={13} /> THERMAL DECISION SUPPORT PROTOTYPE
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.2, marginBottom: '0.5rem' }}>
            Design. Simulate. Optimize.
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Predictive transient thermodynamic modeling and multi-parameter optimization for field shelters deployed in extreme high-altitude alpine and desert operational sectors.
          </p>

          {/* Quick Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
              onClick={() => setActiveTab(isClimateReady ? 'simulation' : 'climate')}
            >
              {isClimateReady ? <LineChart size={16} /> : <CloudSun size={16} />}
              <span>{isClimateReady ? 'Run Thermal Simulation' : 'Fetch NASA Climate Data'}</span>
              <ArrowRight size={15} />
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.2)' }}
              onClick={() => setActiveTab('3d')}
            >
              <span>Explore 3D Shelter</span>
            </button>
          </div>
        </div>

        {/* Tactical Badge Summary */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 1.5rem',
          minWidth: '240px'
        }}>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active Station
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.2rem' }}>
            {weatherData ? `${weatherData.latitude}°, ${weatherData.longitude}°` : 'Leh, Ladakh (Default)'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '0.4rem' }}>
            Elevation: Alpine High-Altitude
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Standard Comfort Band: 18°C – 27°C
          </div>
        </div>
      </div>

      {/* 4 Pipeline Status Cards */}
      <div className="grid-4">
        {/* Card 1: NASA Climate Status */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CloudSun size={20} color="#1e40af" />
            </div>
            <span className={`badge ${isClimateReady ? 'badge-success' : 'badge-warning'}`}>
              {isClimateReady ? 'Loaded' : 'Required'}
            </span>
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Live Climate Data</div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem' }}>
            {isClimateReady
              ? `${weatherData.summary.avgTemperature}°C daily mean (${weatherData.hourly.length} hrs)`
              : 'Requires real NASA hourly records'}
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', marginTop: '0.75rem' }}
            onClick={() => setActiveTab('climate')}
          >
            {isClimateReady ? 'View Weather Data' : 'Fetch Climate Data'}
          </button>
        </div>

        {/* Card 2: Shelter Design Status */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ruler size={20} color="#15803d" />
            </div>
            <span className="badge badge-info">Configured</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Shelter Geometry</div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem' }}>
            {shelter.length}m × {shelter.width}m × {shelter.height}m ({shelter.orientation})
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', marginTop: '0.75rem' }}
            onClick={() => setActiveTab('design')}
          >
            Edit Parameters
          </button>
        </div>

        {/* Card 3: Thermal Comfort Status */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Thermometer size={20} color="#b91c1c" />
            </div>
            <span className={`badge ${isSimReady ? 'badge-success' : 'badge-drdo'}`}>
              {isSimReady ? `${simulationResults.summary.thermalScore}/100` : 'Not Simulated'}
            </span>
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Thermal Comfort</div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem' }}>
            {isSimReady
              ? `${simulationResults.summary.comfortPercentage}% hours in comfort zone`
              : 'Run simulation to evaluate'}
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', marginTop: '0.75rem' }}
            disabled={!isClimateReady}
            onClick={() => setActiveTab('simulation')}
          >
            {isSimReady ? 'View Results' : 'Run Simulation'}
          </button>
        </div>

        {/* Card 4: Optimization Status */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} color="#7e22ce" />
            </div>
            <span className={`badge ${isOptReady ? 'badge-success' : 'badge-drdo'}`}>
              {isOptReady ? 'Evaluated' : 'Available'}
            </span>
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Design Optimization</div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem' }}>
            {isOptReady
              ? `Top score: ${optimizationResults.bestDesign.thermalScore}`
              : 'Multi-parameter solver ready'}
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', marginTop: '0.75rem' }}
            disabled={!isClimateReady}
            onClick={() => setActiveTab('optimization')}
          >
            Optimize Design
          </button>
        </div>
      </div>

      {/* 3D Realistic Shelter Preview in Home */}
      <div className="card" style={{ padding: '1rem' }}>
        <div className="card-header">
          <div className="card-title">
            <Layers size={18} color="#0284c7" />
            <span>Interactive 3D Shelter Model Preview</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Use mouse: Left Drag = Rotate • Wheel = Zoom • Right Drag = Pan
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveTab('3d')}
            >
              Full 3D Studio
            </button>
          </div>
        </div>

        <ShelterCanvas
          shelter={shelter}
          simulationHourly={simulationResults ? simulationResults.hourly : null}
          activeHour={12}
        />
      </div>
    </div>
  );
}
