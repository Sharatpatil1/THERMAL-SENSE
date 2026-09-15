import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts';
import {
  LineChart as ChartIcon,
  Play,
  Save,
  Download,
  AlertTriangle,
  CheckCircle2,
  Thermometer,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { runSimulation, saveSimulationRecord } from '../services/simulationService';
import { downloadClientPdfReport } from '../services/reportService';

export default function ThermalResults({
  shelter,
  selectedMaterials,
  weatherData,
  simulationResults,
  setSimulationResults,
  locationConfig,
  setActiveTab
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);
  const [error, setError] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('temp'); // 'temp', 'flux', 'comfort'

  const hasClimate = Boolean(weatherData && weatherData.hourly && weatherData.hourly.length === 24);

  const handleRunSimulation = async () => {
    if (!hasClimate) {
      setError('NASA POWER climate data is strictly required. Please fetch weather data first.');
      return;
    }

    setLoading(true);
    setError(null);
    setSaveSuccessMsg(null);

    try {
      const result = await runSimulation({
        shelter,
        materials: selectedMaterials,
        weatherHourly: weatherData.hourly
      });

      setSimulationResults(result);
    } catch (err) {
      console.error('Simulation run failed:', err);
      setError(err.message || 'Thermal simulation execution failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!simulationResults) return;
    setSaving(true);
    setError(null);

    try {
      const payload = {
        simulationName: `Shelter-${locationConfig.locationName || 'Field'}-${weatherData.date || '2025-01-15'}`,
        locationName: locationConfig.locationName || 'Leh, Ladakh',
        latitude: weatherData.latitude,
        longitude: weatherData.longitude,
        dateSimulated: weatherData.date,
        weatherSource: weatherData.source || 'NASA POWER API (Hourly)',
        designParameters: shelter,
        materialsUsed: selectedMaterials,
        simulationResults
      };

      const res = await saveSimulationRecord(payload);
      setSaveSuccessMsg(`✓ Simulation saved successfully (ID: ${res.id})`);
    } catch (err) {
      setError(`Failed to save simulation to database: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!simulationResults) return;
    try {
      const record = {
        id: `SIM-${Date.now().toString(36).toUpperCase()}`,
        location_name: locationConfig.locationName,
        latitude: weatherData.latitude,
        longitude: weatherData.longitude,
        date_simulated: weatherData.date,
        design_parameters: shelter,
        materials_used: selectedMaterials,
        simulation_results: simulationResults
      };
      downloadClientPdfReport(record);
    } catch (err) {
      setError(`Failed to generate PDF: ${err.message}`);
    }
  };

  const summary = simulationResults ? simulationResults.summary : null;
  const hourly = simulationResults ? simulationResults.hourly : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Thermal Simulation Engine</h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Transient lumped-capacitance 24-hour heat balance solving conduction, infiltration, solar gains, and internal mass storage.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!hasClimate || loading}
            onClick={handleRunSimulation}
            style={{ backgroundColor: hasClimate ? '#0284c7' : '#94a3b8', borderColor: hasClimate ? '#0284c7' : '#94a3b8' }}
          >
            <Play size={16} />
            <span>{loading ? 'Running thermal simulation...' : (simulationResults ? 'Re-run Simulation' : 'Run Simulation')}</span>
          </button>

          {simulationResults && (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={saving}
                onClick={handleSaveToDatabase}
              >
                <Save size={15} />
                <span>{saving ? 'Saving...' : 'Save Simulation'}</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleDownloadPdf}
              >
                <Download size={15} />
                <span>Download PDF Report</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Missing NASA POWER Climate Alert */}
      {!hasClimate && (
        <div className="alert alert-warning">
          <AlertTriangle size={20} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>NASA POWER climate data required</div>
            <div style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
              Simulation is locked until real NASA POWER hourly solar radiation, ambient temperature, humidity, and wind speed are loaded.
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setActiveTab('climate')}
          >
            Fetch NASA Data
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger">
          <AlertTriangle size={20} />
          <div>
            <div style={{ fontWeight: 700 }}>Simulation Error</div>
            <div style={{ fontSize: '0.82rem' }}>{error}</div>
          </div>
        </div>
      )}

      {/* Save Success Banner */}
      {saveSuccessMsg && (
        <div className="alert alert-success">
          <CheckCircle2 size={20} />
          <div style={{ fontWeight: 700 }}>{saveSuccessMsg}</div>
        </div>
      )}

      {/* Simulation Results Content */}
      {simulationResults && summary && (
        <>
          {/* Key Summary Cards */}
          <div className="grid-4">
            <div className="card">
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Thermal Score
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: summary.thermalScore > 50 ? '#059669' : '#d97706', marginTop: '0.2rem' }}>
                {summary.thermalScore} <span style={{ fontSize: '1rem', color: '#64748b' }}>/ 100</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                Composite index of comfort & stability
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Comfort Percentage
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                {summary.comfortPercentage} <span style={{ fontSize: '1rem', color: '#64748b' }}>%</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: '0.2rem' }}>
                {summary.comfortHours} of 24 hours within 18°C - 27°C
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Average Indoor Temp
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e3a8a', marginTop: '0.2rem' }}>
                {summary.avgIndoorTemp} <span style={{ fontSize: '1rem', color: '#64748b' }}>°C</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                Outdoor Avg: {summary.outdoorAvgTemp}°C
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Envelope Heat Balance
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ea580c', marginTop: '0.2rem' }}>
                {(summary.totalHeatLossWh / 1000).toFixed(1)} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>kWh loss</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: '0.2rem' }}>
                {(summary.totalHeatGainWh / 1000).toFixed(1)} kWh solar + internal gain
              </div>
            </div>
          </div>

          {/* Sub-tab Navigation */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
            <button
              type="button"
              className={`btn btn-sm ${activeSubTab === 'temp' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveSubTab('temp')}
            >
              Indoor vs Outdoor Temperature
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeSubTab === 'flux' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveSubTab('flux')}
            >
              Heat Gain & Loss Breakdown
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeSubTab === 'comfort' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveSubTab('comfort')}
            >
              Thermal Comfort & Limiting Factors
            </button>
          </div>

          {/* Tab 1: Indoor vs Outdoor Temperature Chart */}
          {activeSubTab === 'temp' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <Thermometer size={18} color="#0284c7" />
                  <span>Diurnal Indoor vs Outdoor Temperature Curves</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Target Comfort Band: 18°C – 27°C
                </div>
              </div>

              <div style={{ width: '100%', height: 380 }}>
                <ResponsiveContainer>
                  <LineChart data={hourly} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#64748b" style={{ fontSize: '0.75rem' }} />
                    <YAxis stroke="#64748b" unit="°C" domain={['auto', 'auto']} style={{ fontSize: '0.75rem' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff', borderRadius: '6px' }}
                      formatter={(val, name) => [`${val} °C`, name === 'indoorTemp' ? 'Indoor Temp' : 'Outdoor Temp']}
                    />
                    <Legend />
                    {/* Comfort zone references */}
                    <Line
                      type="monotone"
                      dataKey="indoorTemp"
                      name="Indoor Temperature"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="outdoorTemp"
                      name="Outdoor Temperature (NASA)"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tab 2: Heat Flux Breakdown Chart */}
          {activeSubTab === 'flux' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <ChartIcon size={18} color="#ea580c" />
                  <span>Component Heat Flux Dynamics (Watts)</span>
                </div>
              </div>

              <div style={{ width: '100%', height: 380 }}>
                <ResponsiveContainer>
                  <AreaChart data={hourly} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#64748b" style={{ fontSize: '0.75rem' }} />
                    <YAxis stroke="#64748b" unit="W" style={{ fontSize: '0.75rem' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', color: '#ffffff', borderRadius: '6px' }} />
                    <Legend />
                    <Area type="monotone" dataKey="solarGain" name="Solar Gain (W)" fill="#f59e0b" stroke="#d97706" fillOpacity={0.4} />
                    <Area type="monotone" dataKey="internalGain" name="Internal Gain (W)" fill="#10b981" stroke="#059669" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="conductionGainLoss" name="Conduction Net (W)" fill="#6366f1" stroke="#4f46e5" fillOpacity={0.2} />
                    <Area type="monotone" dataKey="infiltrationGainLoss" name="Infiltration Net (W)" fill="#ef4444" stroke="#dc2626" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tab 3: Comfort Analysis */}
          {activeSubTab === 'comfort' && (
            <div className="grid-2">
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Comfort Band Compliance</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)' }}>
                    <span style={{ color: '#64748b' }}>Design Comfort Range:</span>
                    <span style={{ fontWeight: 700 }}>18.0°C – 27.0°C</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)' }}>
                    <span style={{ color: '#64748b' }}>Hours in Comfort Zone:</span>
                    <span style={{ fontWeight: 700, color: '#059669' }}>{summary.comfortHours} of 24 hrs ({summary.comfortPercentage}%)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)' }}>
                    <span style={{ color: '#64748b' }}>Minimum Indoor Diurnal Dip:</span>
                    <span style={{ fontWeight: 700, color: summary.minIndoorTemp < 18 ? '#dc2626' : '#059669' }}>{summary.minIndoorTemp}°C</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)' }}>
                    <span style={{ color: '#64748b' }}>Maximum Indoor Peak:</span>
                    <span style={{ fontWeight: 700 }}>{summary.maxIndoorTemp}°C</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.5rem' }}>
                    * Label: Temperature-band comfort indicator. Full PMV/PPD modeling requires localized clothing clo and metabolic met field measurements.
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-title">Next Steps & Optimization</div>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6 }}>
                  To maximize soldier operational effectiveness and reduce auxiliary generator heating fuel logistics in this high-altitude outpost, run the multi-parameter optimization solver.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: '1rem', width: '100%' }}
                  onClick={() => setActiveTab('optimization')}
                >
                  <span>Launch Optimization Solver</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
