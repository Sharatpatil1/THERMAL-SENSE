import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardHome from './pages/DashboardHome';
import LocationClimate from './pages/LocationClimate';
import ShelterDesign from './pages/ShelterDesign';
import Materials from './pages/Materials';
import Shelter3DPage from './pages/Shelter3DPage';
import ThermalResults from './pages/ThermalResults';
import Optimization from './pages/Optimization';
import SavedReports from './pages/SavedReports';
import ComparisonModal from './components/ComparisonModal';
import { getMaterials } from './services/simulationService';
import './styles/index.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Initial Demo Coordinates & Date (Prompt 37: Leh, Ladakh, India 34.1526, 77.5771, 2025-01-15)
  const [locationConfig, setLocationConfig] = useState({
    locationName: 'Leh, Ladakh, India',
    latitude: 34.1526,
    longitude: 77.5771,
    date: '2025-01-15'
  });

  // Weather data starts as NULL: Must be fetched from NASA POWER!
  const [weatherData, setWeatherData] = useState(null);

  // Shelter specifications
  const [shelter, setShelter] = useState({
    length: 6.0,
    width: 4.0,
    height: 2.8,
    orientation: 'South',
    windowArea: 1.2,
    doorArea: 1.8,
    occupancy: 6,
    ach: 0.5,
    equipmentHeatLoadW: 150,
    lightingHeatLoadW: 60,
    wallThicknessM: 0.20,
    wallInsulationThicknessM: 0.10,
    roofThicknessM: 0.15,
    roofInsulationThicknessM: 0.10,
    floorThicknessM: 0.15,
    floorInsulationThicknessM: 0.05,
    comfortMin: 18,
    comfortMax: 27
  });

  // Materials list & selection
  const [materialsList, setMaterialsList] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState({
    wallStructural: { id: 'structural_timber', name: 'Structural Timber', category: 'structural', thermal_conductivity: 0.13, density: 550, specific_heat: 1600, solar_absorptance: 0.65 },
    wallInsulation: { id: 'mineral_wool', name: 'Mineral Wool', category: 'insulation', thermal_conductivity: 0.04, density: 80, specific_heat: 840, solar_absorptance: 0.40 },
    roofStructural: { id: 'aluminium_cladding', name: 'Aluminium Sandwich Panel', category: 'finishing', thermal_conductivity: 0.05, density: 45, specific_heat: 900, solar_absorptance: 0.20 },
    roofInsulation: { id: 'mineral_wool', name: 'Mineral Wool', category: 'insulation', thermal_conductivity: 0.04, density: 80, specific_heat: 840, solar_absorptance: 0.40 },
    floorStructural: { id: 'insulated_concrete', name: 'Insulated Concrete Form', category: 'structural', thermal_conductivity: 0.22, density: 1200, specific_heat: 1000, solar_absorptance: 0.55 },
    floorInsulation: { id: 'xps_insulation', name: 'XPS Insulation', category: 'insulation', thermal_conductivity: 0.03, density: 35, specific_heat: 1500, solar_absorptance: 0.30 }
  });

  // Simulation & Optimization states
  const [simulationResults, setSimulationResults] = useState(null);
  const [optimizationResults, setOptimizationResults] = useState(null);

  // Load materials from backend
  useEffect(() => {
    getMaterials()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setMaterialsList(data);
          // Set initial objects if matched
          const timber = data.find(m => m.id === 'structural_timber');
          const wool = data.find(m => m.id === 'mineral_wool');
          const alu = data.find(m => m.id === 'aluminium_cladding');
          const xps = data.find(m => m.id === 'xps_insulation');
          const icf = data.find(m => m.id === 'insulated_concrete');

          setSelectedMaterials(prev => ({
            ...prev,
            wallStructural: timber || prev.wallStructural,
            wallInsulation: wool || prev.wallInsulation,
            roofStructural: alu || prev.roofStructural,
            roofInsulation: wool || prev.roofInsulation,
            floorStructural: icf || prev.floorStructural,
            floorInsulation: xps || prev.floorInsulation
          }));
        }
      })
      .catch(err => console.warn('Could not prefetch materials:', err.message));
  }, []);

  const handleApplyOptimizedDesign = (bestDesign) => {
    setShelter(prev => ({
      ...prev,
      orientation: bestDesign.orientation,
      wallInsulationThicknessM: bestDesign.insulationThicknessMm / 1000,
      roofInsulationThicknessM: bestDesign.insulationThicknessMm / 1000
    }));

    // Find and set materials
    const matchedInsul = materialsList.find(m => m.name === bestDesign.insulationMaterial);
    const matchedWall = materialsList.find(m => m.name === bestDesign.wallMaterial);

    if (matchedInsul || matchedWall) {
      setSelectedMaterials(prev => ({
        ...prev,
        wallStructural: matchedWall || prev.wallStructural,
        wallInsulation: matchedInsul || prev.wallInsulation,
        roofInsulation: matchedInsul || prev.roofInsulation
      }));
    }

    setActiveTab('3d');
  };

  const handleLoadSimulationIntoApp = (fullRecord) => {
    if (fullRecord.design_parameters) {
      setShelter(fullRecord.design_parameters);
    }
    if (fullRecord.materials_used) {
      setSelectedMaterials(fullRecord.materials_used);
    }
    if (fullRecord.simulation_results) {
      setSimulationResults(fullRecord.simulation_results);
    }
    if (fullRecord.location_name) {
      setLocationConfig({
        locationName: fullRecord.location_name,
        latitude: fullRecord.latitude,
        longitude: fullRecord.longitude,
        date: fullRecord.date_simulated
      });
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        climateLoaded={Boolean(weatherData && weatherData.hourly)}
        simulationDone={Boolean(simulationResults && simulationResults.summary)}
        isOpen={sidebarOpen}
      />

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <Header
          toggleMobileSidebar={() => setSidebarOpen(prev => !prev)}
          climateLoaded={Boolean(weatherData && weatherData.hourly)}
          simulationDone={Boolean(simulationResults && simulationResults.summary)}
        />

        <main className="page-content">
          {activeTab === 'home' && (
            <DashboardHome
              setActiveTab={setActiveTab}
              weatherData={weatherData}
              shelter={shelter}
              simulationResults={simulationResults}
              optimizationResults={optimizationResults}
            />
          )}

          {activeTab === 'climate' && (
            <LocationClimate
              locationConfig={locationConfig}
              setLocationConfig={setLocationConfig}
              weatherData={weatherData}
              setWeatherData={setWeatherData}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'design' && (
            <ShelterDesign
              shelter={shelter}
              setShelter={setShelter}
              setActiveTab={setActiveTab}
              climateLoaded={Boolean(weatherData && weatherData.hourly)}
            />
          )}

          {activeTab === 'materials' && (
            <Materials
              materialsList={materialsList}
              selectedMaterials={selectedMaterials}
              setSelectedMaterials={setSelectedMaterials}
              shelter={shelter}
              setShelter={setShelter}
            />
          )}

          {activeTab === '3d' && (
            <Shelter3DPage
              shelter={shelter}
              simulationResults={simulationResults}
              weatherData={weatherData}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'simulation' && (
            <ThermalResults
              shelter={shelter}
              selectedMaterials={selectedMaterials}
              weatherData={weatherData}
              simulationResults={simulationResults}
              setSimulationResults={setSimulationResults}
              locationConfig={locationConfig}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'optimization' && (
            <Optimization
              shelter={shelter}
              weatherData={weatherData}
              optimizationResults={optimizationResults}
              setOptimizationResults={setOptimizationResults}
              setActiveTab={setActiveTab}
              onApplyOptimizedDesign={handleApplyOptimizedDesign}
            />
          )}

          {activeTab === 'comparison' && (
            <ComparisonModal
              shelter={shelter}
              selectedMaterials={selectedMaterials}
              weatherData={weatherData}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'reports' && (
            <SavedReports
              onLoadSimulationIntoApp={handleLoadSimulationIntoApp}
              setActiveTab={setActiveTab}
            />
          )}
        </main>
      </div>
    </div>
  );
}
