import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, RefreshCw, AlertCircle, Database } from 'lucide-react';
import { listSavedSimulations, getSimulationDetails } from '../services/simulationService';
import { downloadClientPdfReport } from '../services/reportService';

export default function SavedReports({ onLoadSimulationIntoApp, setActiveTab }) {
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listSavedSimulations();
      setSimulations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(`Failed to retrieve saved simulations: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleDownloadPdf = async (sim) => {
    try {
      // If we only have summary, fetch full record
      const fullRecord = await getSimulationDetails(sim.id);
      downloadClientPdfReport(fullRecord);
    } catch (err) {
      alert(`Could not download PDF report: ${err.message}`);
    }
  };

  const handleLoadSimulation = async (sim) => {
    try {
      const fullRecord = await getSimulationDetails(sim.id);
      if (onLoadSimulationIntoApp) {
        onLoadSimulationIntoApp(fullRecord);
        setActiveTab('simulation');
      }
    } catch (err) {
      alert(`Failed to load simulation: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Saved Field Simulations & Reports</h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Historical mission simulations saved to database with full parameter sets and exportable formal reports.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={fetchList}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Database</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-warning">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Simulations Table */}
      <div className="card">
        {simulations.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
            <Database size={36} style={{ margin: '0 auto 0.75rem auto', color: '#cbd5e1' }} />
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>No Saved Simulations Yet</div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Run a thermal simulation and click <strong>"Save Simulation"</strong> to record mission configurations.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Simulation ID</th>
                  <th>Location Name</th>
                  <th>Date</th>
                  <th>Coordinates</th>
                  <th>Comfort %</th>
                  <th>Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {simulations.map((sim) => (
                  <tr key={sim.id}>
                    <td>
                      <span className="font-mono" style={{ fontWeight: 700, color: '#1e3a8a' }}>{sim.id}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{sim.location_name}</td>
                    <td className="font-mono">{sim.date_simulated}</td>
                    <td className="font-mono" style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {sim.latitude}°, {sim.longitude}°
                    </td>
                    <td>
                      <span className="badge badge-success">{sim.comfort_percent}%</span>
                    </td>
                    <td className="font-mono" style={{ fontWeight: 700, color: '#059669' }}>
                      {sim.thermal_score}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleLoadSimulation(sim)}
                          title="Load into 3D and charts"
                        >
                          <Eye size={13} /> Load
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleDownloadPdf(sim)}
                          title="Download professional PDF report"
                        >
                          <Download size={13} /> PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
