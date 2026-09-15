import React, { useState } from 'react';
import {
  Sparkles,
  Trophy,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { runOptimization } from '../services/simulationService';

export default function Optimization({
  shelter,
  weatherData,
  optimizationResults,
  setOptimizationResults,
  setActiveTab,
  onApplyOptimizedDesign
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const hasClimate = Boolean(weatherData && weatherData.hourly && weatherData.hourly.length === 24);

  const handleRunOptimization = async () => {
    if (!hasClimate) {
      setError('NASA POWER climate data is required to run the optimization engine.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await runOptimization({
        baseShelter: shelter,
        weatherHourly: weatherData.hourly,
        targetObjective: 'maximize_comfort'
      });

      setOptimizationResults(res);
    } catch (err) {
      console.error('Optimization failed:', err);
      setError(err.message || 'Optimization solver failed.');
    } finally {
      setLoading(false);
    }
  };

  const best = optimizationResults ? optimizationResults.bestDesign : null;
  const topList = optimizationResults ? optimizationResults.topRankedCandidates : [];
  const recommendations = optimizationResults ? optimizationResults.recommendations : [];
  const suggestions = optimizationResults ? optimizationResults.suggestions : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Multi-Objective Design Optimization</h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Automated parametric solver evaluating wall/roof materials, insulation thicknesses (50mm–200mm), and solar orientations against NASA climate data.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          disabled={!hasClimate || loading}
          onClick={handleRunOptimization}
        >
          <Sparkles size={16} />
          <span>{loading ? 'Evaluating design combinations...' : (optimizationResults ? 'Re-run Optimization' : 'Optimize Design')}</span>
        </button>
      </div>

      {/* Climate Requirement Warning */}
      {!hasClimate && (
        <div className="alert alert-warning">
          <AlertTriangle size={20} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>NASA POWER data required</div>
            <div style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
              The optimization engine evaluates realistic thermodynamic behavior across 24 hourly solar and temperature cycles. Load NASA weather first.
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
            <div style={{ fontWeight: 700 }}>Optimization Engine Error</div>
            <div style={{ fontSize: '0.82rem' }}>{error}</div>
          </div>
        </div>
      )}

      {/* Best Design Showcase Card */}
      {best && (
        <div className="card" style={{
          backgroundColor: '#eff6ff',
          borderColor: '#93c5fd',
          boxShadow: '0 4px 12px rgba(30, 58, 138, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trophy size={22} color="#fbbf24" />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Optimal Field Shelter Configuration (Rank #1)
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  {best.wallMaterial} + {best.insulationThicknessMm}mm {best.insulationMaterial} ({best.orientation} Facade)
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Thermal Score</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669' }}>{best.thermalScore} / 100</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Comfort (18-27°C)</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>{best.comfortPercent}%</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Assembly U-Value</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#2563eb' }}>{best.uValue} <span style={{ fontSize: '0.75rem' }}>W/m²K</span></div>
              </div>

              {onApplyOptimizedDesign && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => onApplyOptimizedDesign(best)}
                >
                  Apply to 3D Model
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top 5 - 10 Ranked Candidates Table */}
      {topList.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Award size={18} color="#059669" />
              <span>Top-Ranked Design Candidates (Evaluated: {optimizationResults.totalEvaluated} Permutations)</span>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Wall / Roof Material</th>
                  <th>Insulation Core</th>
                  <th>Thickness</th>
                  <th>Orientation</th>
                  <th>U-Value</th>
                  <th>Avg Indoor</th>
                  <th>Comfort %</th>
                  <th>Thermal Score</th>
                </tr>
              </thead>
              <tbody>
                {topList.map((item, idx) => (
                  <tr
                    key={item.id}
                    style={{
                      backgroundColor: idx === 0 ? '#f0fdf4' : 'transparent',
                      fontWeight: idx === 0 ? 700 : 400
                    }}
                  >
                    <td>
                      <span className={`badge ${idx === 0 ? 'badge-success' : 'badge-drdo'}`}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td>{item.wallMaterial}</td>
                    <td>{item.insulationMaterial}</td>
                    <td className="font-mono">{item.insulationThicknessMm} mm</td>
                    <td>{item.orientation}</td>
                    <td className="font-mono">{item.uValue} W/m²K</td>
                    <td className="font-mono">{item.avgIndoorTemp} °C</td>
                    <td className="font-mono" style={{ color: item.comfortPercent > 50 ? '#059669' : '#d97706' }}>
                      {item.comfortPercent} %
                    </td>
                    <td className="font-mono" style={{ fontWeight: 700, color: '#1e3a8a' }}>
                      {item.thermalScore}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Component Material Recommendations */}
      {recommendations.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <CheckCircle size={18} color="#0284c7" />
              <span>Engineered Component Material Recommendations</span>
            </div>
          </div>

          <div className="grid-3">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem'
                }}
              >
                <span className="badge badge-info" style={{ alignSelf: 'flex-start' }}>{rec.component}</span>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', marginTop: '0.2rem' }}>
                  {rec.recommendedMaterial}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                  Insulation: <strong>{rec.insulationMaterial}</strong> ({rec.thicknessMm} mm)
                </div>
                <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
                  R-Value: {rec.rValue} m²·K/W (k: {rec.thermalConductivity} W/mK)
                </div>
                <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.25rem' }}>
                  Benefit: {rec.expectedThermalBenefit}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.25rem' }}>
                  Field Note: {rec.practicalNotes}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actionable Engineering Suggestions */}
      {suggestions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Lightbulb size={18} color="#f59e0b" />
              <span>Prioritized Tactical Field Optimization Directives</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {suggestions.map((sug, idx) => {
              const priorityClass = sug.priority === 'High' ? 'badge-danger' : (sug.priority === 'Medium' ? 'badge-warning' : 'badge-drdo');
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    gap: '1rem'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span className={`badge ${priorityClass}`}>{sug.priority} Priority</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{sug.category}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{sug.title}</div>
                    <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.15rem' }}>{sug.impact}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.25rem' }}>{sug.notes}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
