import React from 'react';
import Foundation from './Foundation';
import Wall from './Wall';
import Roof from './Roof';
import Door from './Door';
import Window from './Window';
import InteriorElements from './InteriorElements';
import { getTemperatureColor } from './ThermalColorMap';

export default function ShelterBuilding({
  length = 6.0,
  width = 4.0,
  height = 2.8,
  orientation = 'South',
  occupancy = 6,
  wallThickness = 0.20,
  viewMode = 'exterior', // 'exterior', 'interior', 'thermal', 'wireframe'
  showInsulation = false,
  componentTemps = {
    roof: 16.5,
    wall: 18.2,
    floor: 12.0,
    indoor: 19.5,
    outdoor: -5.0
  }
}) {
  const isWireframe = viewMode === 'wireframe';
  const isThermal = viewMode === 'thermal';
  const isInterior = viewMode === 'interior';

  // Compute thermal colors if thermal mode is active
  const roofColor = isThermal ? getTemperatureColor(componentTemps.roof) : null;
  const wallColor = isThermal ? getTemperatureColor(componentTemps.wall) : null;
  const floorColor = isThermal ? getTemperatureColor(componentTemps.floor) : null;
  const doorColor = isThermal ? getTemperatureColor(componentTemps.wall) : null;
  const windowColor = isThermal ? getTemperatureColor(componentTemps.indoor) : null;

  const floorThickness = 0.15;
  const halfLength = length / 2;
  const halfWidth = width / 2;

  // Window positions (flanking front door at X = -1.8 and X = +1.8)
  const windowX = Math.min(halfLength - 0.7, 1.8);

  // Rotation angle around Y-axis based on cardinal orientation
  let orientationAngle = 0;
  if (orientation === 'North') orientationAngle = Math.PI;
  else if (orientation === 'East') orientationAngle = -Math.PI / 2;
  else if (orientation === 'West') orientationAngle = Math.PI / 2;
  else orientationAngle = 0; // South (+Z)

  const groundRadius = Math.max(12, Math.max(length, width) * 1.6);

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Stationary Ground Terrain Plane in World Coordinates */}
      <mesh
        receiveShadow
        position={[0, -0.32, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[groundRadius, 64]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.95}
          metalness={0.05}
          wireframe={isWireframe}
        />
      </mesh>

      {/* World Cardinal Orientation Indicators on Ground */}
      <group position={[0, -0.30, 0]}>
        {/* Cardinal Grid Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[groundRadius * 0.75, groundRadius * 0.76, 64]} />
          <meshBasicMaterial color="#334155" />
        </mesh>

        {/* North Indicator (-Z in world space) */}
        <mesh position={[0, 0.01, -groundRadius * 0.75]}>
          <boxGeometry args={[0.3, 0.02, 0.6]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        {/* South Indicator (+Z in world space) */}
        <mesh position={[0, 0.01, groundRadius * 0.75]}>
          <boxGeometry args={[0.3, 0.02, 0.6]} />
          <meshBasicMaterial color="#94a3b8" />
        </mesh>
        {/* East Indicator (+X in world space) */}
        <mesh position={[groundRadius * 0.75, 0.01, 0]}>
          <boxGeometry args={[0.6, 0.02, 0.3]} />
          <meshBasicMaterial color="#94a3b8" />
        </mesh>
        {/* West Indicator (-X in world space) */}
        <mesh position={[-groundRadius * 0.75, 0.01, 0]}>
          <boxGeometry args={[0.6, 0.02, 0.3]} />
          <meshBasicMaterial color="#94a3b8" />
        </mesh>
      </group>

      {/* 2. Rotatable Shelter Assembly (Aligns to Selected Facade Orientation) */}
      <group rotation={[0, orientationAngle, 0]}>
        {/* Concrete Foundation Base Plinth */}
        <Foundation
          length={length}
          width={width}
          wireframe={isWireframe}
          color={floorColor ? floorColor.getHexString() : '#334155'}
        />

        {/* Floor Slab */}
        <mesh
          receiveShadow
          position={[0, floorThickness / 2, 0]}
        >
          <boxGeometry args={[length, floorThickness, width]} />
          <meshStandardMaterial
            color={floorColor || '#475569'}
            roughness={0.8}
            wireframe={isWireframe}
          />
        </mesh>

        {/* Building superstructure seated on floor slab */}
        <group position={[0, floorThickness, 0]}>
          {/* 4. Four Interlocking Walls with Realistic Thickness */}
          <Wall
            length={length}
            width={width}
            height={height}
            wallThickness={wallThickness}
            wireframe={isWireframe}
            thermalColor={wallColor}
            isInteriorView={isInterior}
            showInsulation={showInsulation}
          />

          {/* 5. Front Centered Door */}
          <Door
            position={[0, 2.05 / 2, halfWidth - wallThickness / 2]}
            width={0.95}
            height={2.05}
            depth={wallThickness + 0.02}
            wireframe={isWireframe}
            thermalColor={doorColor}
          />

          {/* 6. Front Windows (Left & Right of Door) */}
          <Window
            position={[-windowX, 1.5, halfWidth - wallThickness / 2]}
            width={1.0}
            height={1.1}
            depth={wallThickness + 0.02}
            wireframe={isWireframe}
            thermalColor={windowColor}
          />
          <Window
            position={[windowX, 1.5, halfWidth - wallThickness / 2]}
            width={1.0}
            height={1.1}
            depth={wallThickness + 0.02}
            wireframe={isWireframe}
            thermalColor={windowColor}
          />

          {/* Side Window on East Wall */}
          <group position={[halfLength - wallThickness / 2, 1.5, 0]} rotation={[0, Math.PI / 2, 0]}>
            <Window
              position={[0, 0, 0]}
              width={0.9}
              height={0.9}
              depth={wallThickness + 0.02}
              wireframe={isWireframe}
              thermalColor={windowColor}
            />
          </group>

          {/* 7. Pitched Sloped Gable Roof with Eaves Overhang */}
          <Roof
            length={length}
            width={width}
            wallHeight={height}
            wireframe={isWireframe}
            thermalColor={roofColor}
            isInteriorView={isInterior}
            showInsulation={showInsulation}
          />

          {/* 8. Interior Furnishings & Soldier Occupants */}
          {isInterior && (
            <InteriorElements occupancy={occupancy} />
          )}
        </group>
      </group>
    </group>
  );
}
