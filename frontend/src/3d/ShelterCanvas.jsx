import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import ShelterBuilding from './ShelterBuilding';
import Compass from './Compass';
import TemperatureLegend from './TemperatureLegend';
import {
  Eye,
  Flame,
  Box,
  Layers,
  Camera,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

export default function ShelterCanvas({
  shelter = {
    length: 6.0,
    width: 4.0,
    height: 2.8,
    orientation: 'South',
    occupancy: 6,
    wallThicknessM: 0.20
  },
  simulationHourly = null,
  activeHour = 12
}) {
  const [viewMode, setViewMode] = useState('exterior'); // 'exterior', 'interior', 'thermal', 'wireframe'
  const [showInsulation, setShowInsulation] = useState(false);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);

  // Extract hourly component surface temps if simulation is available
  const currentHourData = (simulationHourly && simulationHourly[activeHour])
    ? simulationHourly[activeHour]
    : null;

  const componentTemps = currentHourData && currentHourData.componentTemps
    ? currentHourData.componentTemps
    : {
        roof: 20.0,
        wall: 18.5,
        floor: 14.0,
        indoor: 19.5,
        outdoor: 5.0
      };

  // Programmatic Camera & Orbit Controls manipulation
  const handleResetCamera = () => {
    if (controlsRef.current && cameraRef.current) {
      cameraRef.current.position.set(8, 6, 8);
      controlsRef.current.target.set(0, 1.5, 0);
      controlsRef.current.update();
    }
  };

  const handleTopView = () => {
    if (controlsRef.current && cameraRef.current) {
      cameraRef.current.position.set(0.01, 14, 0);
      controlsRef.current.target.set(0, 1.5, 0);
      controlsRef.current.update();
    }
  };

  const handleFrontView = () => {
    if (controlsRef.current && cameraRef.current) {
      cameraRef.current.position.set(0, 2, 10);
      controlsRef.current.target.set(0, 1.5, 0);
      controlsRef.current.update();
    }
  };

  const handleSideView = () => {
    if (controlsRef.current && cameraRef.current) {
      cameraRef.current.position.set(10, 2, 0);
      controlsRef.current.target.set(0, 1.5, 0);
      controlsRef.current.update();
    }
  };

  // Interactive camera rotation around target
  const handleRotateLeft = () => {
    if (controlsRef.current && cameraRef.current) {
      const angle = Math.PI / 12; // 15 degrees
      const pos = cameraRef.current.position;
      const target = controlsRef.current.target;
      const x = pos.x - target.x;
      const z = pos.z - target.z;
      pos.x = target.x + x * Math.cos(angle) - z * Math.sin(angle);
      pos.z = target.z + x * Math.sin(angle) + z * Math.cos(angle);
      controlsRef.current.update();
    }
  };

  const handleRotateRight = () => {
    if (controlsRef.current && cameraRef.current) {
      const angle = -Math.PI / 12; // -15 degrees
      const pos = cameraRef.current.position;
      const target = controlsRef.current.target;
      const x = pos.x - target.x;
      const z = pos.z - target.z;
      pos.x = target.x + x * Math.cos(angle) - z * Math.sin(angle);
      pos.z = target.z + x * Math.sin(angle) + z * Math.cos(angle);
      controlsRef.current.update();
    }
  };

  const handlePitchUp = () => {
    if (controlsRef.current && cameraRef.current) {
      cameraRef.current.position.y = Math.min(20, cameraRef.current.position.y + 1.2);
      controlsRef.current.update();
    }
  };

  const handlePitchDown = () => {
    if (controlsRef.current && cameraRef.current) {
      cameraRef.current.position.y = Math.max(0.5, cameraRef.current.position.y - 1.2);
      controlsRef.current.update();
    }
  };

  const handleZoomIn = () => {
    if (controlsRef.current && cameraRef.current) {
      const pos = cameraRef.current.position;
      const target = controlsRef.current.target;
      pos.lerp(target, 0.2);
      controlsRef.current.update();
    }
  };

  const handleZoomOut = () => {
    if (controlsRef.current && cameraRef.current) {
      const pos = cameraRef.current.position;
      const target = controlsRef.current.target;
      pos.x = target.x + (pos.x - target.x) * 1.2;
      pos.y = target.y + (pos.y - target.y) * 1.2;
      pos.z = target.z + (pos.z - target.z) * 1.2;
      controlsRef.current.update();
    }
  };

  return (
    <div className="viewport-3d-wrapper">
      {/* 3D Scene Viewport */}
      <Canvas shadows gl={{ antialias: true, alpha: false }}>
        <PerspectiveCamera
          ref={cameraRef}
          makeDefault
          position={[8, 6, 8]}
          fov={45}
          near={0.1}
          far={100}
        />
        <OrbitControls
          ref={controlsRef}
          target={[0, 1.5, 0]}
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2 + 0.05}
          minDistance={3}
          maxDistance={25}
        />

        {/* Ambient & Directional Lighting */}
        <ambientLight intensity={0.65} />
        <directionalLight
          position={[10, 15, 8]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={40}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <directionalLight position={[-8, 10, -8]} intensity={0.4} />

        {/* The Realistic Shelter Model */}
        <ShelterBuilding
          length={Number(shelter.length) || 6.0}
          width={Number(shelter.width) || 4.0}
          height={Number(shelter.height) || 2.8}
          orientation={shelter.orientation || 'South'}
          occupancy={Number(shelter.occupancy) || 6}
          wallThickness={Number(shelter.wallThicknessM) || 0.20}
          viewMode={viewMode}
          showInsulation={showInsulation}
          componentTemps={componentTemps}
        />
      </Canvas>

      {/* Top Left Overlay: View Modes */}
      <div className="viewport-overlay-controls">
        <button
          type="button"
          className={`btn btn-sm ${viewMode === 'exterior' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setViewMode('exterior')}
          title="Standard Exterior Realistic View"
        >
          <Eye size={14} /> Exterior
        </button>

        <button
          type="button"
          className={`btn btn-sm ${viewMode === 'interior' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setViewMode('interior')}
          title="See inside: floor, bunks, desk, heater, occupants"
        >
          <Box size={14} /> Interior
        </button>

        <button
          type="button"
          className={`btn btn-sm ${viewMode === 'thermal' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setViewMode('thermal')}
          title="Heat map visualization based on thermal simulation"
        >
          <Flame size={14} color={viewMode === 'thermal' ? '#f97316' : 'currentColor'} /> Thermal View
        </button>

        <button
          type="button"
          className={`btn btn-sm ${viewMode === 'wireframe' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setViewMode('wireframe')}
          title="Structural geometry wireframe"
        >
          <Box size={14} /> Wireframe
        </button>

        <button
          type="button"
          className={`btn btn-sm ${showInsulation ? 'btn-accent' : 'btn-secondary'}`}
          onClick={() => setShowInsulation(prev => !prev)}
          title="Toggle insulation layer jacket"
        >
          <Layers size={14} /> {showInsulation ? 'Insulation ON' : 'Show Insulation'}
        </button>
      </div>

      {/* Top Right Overlay: Compass & Temperature Legend */}
      <div className="viewport-overlay-right">
        <Compass orientation={shelter.orientation || 'South'} />
        <TemperatureLegend visible={viewMode === 'thermal'} />
      </div>

      {/* Bottom Left Overlay: Interactive Navigation Controls (Rotate, Zoom, Angles) */}
      <div className="viewport-overlay-bottom" style={{ flexWrap: 'wrap', maxWidth: '75%' }}>
        {/* Rotation and Zoom Action Group */}
        <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: 'rgba(15, 23, 42, 0.85)', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #334155' }}>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={handleRotateLeft}
            title="Rotate View Left (Counter-clockwise)"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            <RotateCcw size={13} /> Rotate L
          </button>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={handleRotateRight}
            title="Rotate View Right (Clockwise)"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            <RotateCw size={13} /> Rotate R
          </button>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={handlePitchUp}
            title="Tilt Upwards"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            <ChevronUp size={13} /> Tilt Up
          </button>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={handlePitchDown}
            title="Tilt Downwards"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            <ChevronDown size={13} /> Tilt Down
          </button>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={handleZoomIn}
            title="Zoom In"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            <ZoomIn size={13} />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={handleZoomOut}
            title="Zoom Out"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            <ZoomOut size={13} />
          </button>
        </div>

        {/* View Angles Group */}
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={handleResetCamera}
            title="Reset to Default Perspective"
          >
            <Camera size={13} /> Reset
          </button>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={handleFrontView}
            title="Front Facade View"
          >
            Front
          </button>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={handleSideView}
            title="Side Profile View"
          >
            Side
          </button>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={handleTopView}
            title="Top Down Roof Plan"
          >
            Top Plan
          </button>
        </div>
      </div>
    </div>
  );
}
