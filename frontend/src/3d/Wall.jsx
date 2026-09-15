import React from 'react';

export default function Wall({
  length = 6.0,
  width = 4.0,
  height = 2.8,
  wallThickness = 0.20,
  wireframe = false,
  thermalColor = null,
  isInteriorView = false,
  showInsulation = false
}) {
  const wallColor = thermalColor || '#cbd5e1'; // Light engineering wall panel
  const insulationColor = '#f59e0b'; // Amber insulation layer

  const doorWidth = 1.0;
  const doorHeight = 2.05;

  const halfL = length / 2;
  const halfW = width / 2;
  const halfH = height / 2;

  // Front wall segments around centered door
  const frontSideWidth = (length - doorWidth) / 2;
  const frontLintelHeight = height - doorHeight;

  return (
    <group position={[0, 0, 0]}>
      {/* 1. North Wall (Rear, continuous) */}
      <mesh
        castShadow
        receiveShadow
        position={[0, halfH, -halfW + wallThickness / 2]}
      >
        <boxGeometry args={[length, height, wallThickness]} />
        <meshStandardMaterial
          color={wallColor}
          roughness={0.8}
          metalness={0.1}
          wireframe={wireframe}
        />
      </mesh>

      {/* 2. West Wall (Left side) */}
      <mesh
        castShadow
        receiveShadow
        position={[-halfL + wallThickness / 2, halfH, 0]}
      >
        <boxGeometry args={[wallThickness, height, width - wallThickness * 2]} />
        <meshStandardMaterial
          color={wallColor}
          roughness={0.8}
          metalness={0.1}
          wireframe={wireframe}
        />
      </mesh>

      {/* 3. East Wall (Right side) */}
      <mesh
        castShadow
        receiveShadow
        position={[halfL - wallThickness / 2, halfH, 0]}
      >
        <boxGeometry args={[wallThickness, height, width - wallThickness * 2]} />
        <meshStandardMaterial
          color={wallColor}
          roughness={0.8}
          metalness={0.1}
          wireframe={wireframe}
        />
      </mesh>

      {/* 4. South Wall (Front facade, split for door opening) */}
      <group position={[0, 0, halfW - wallThickness / 2]}>
        {/* Left front wall panel */}
        <mesh
          castShadow
          receiveShadow
          position={[-halfL + frontSideWidth / 2, halfH, 0]}
        >
          <boxGeometry args={[frontSideWidth, height, wallThickness]} />
          <meshStandardMaterial
            color={wallColor}
            roughness={0.8}
            metalness={0.1}
            wireframe={wireframe}
            transparent={isInteriorView}
            opacity={isInteriorView ? 0.3 : 1.0}
          />
        </mesh>

        {/* Right front wall panel */}
        <mesh
          castShadow
          receiveShadow
          position={[halfL - frontSideWidth / 2, halfH, 0]}
        >
          <boxGeometry args={[frontSideWidth, height, wallThickness]} />
          <meshStandardMaterial
            color={wallColor}
            roughness={0.8}
            metalness={0.1}
            wireframe={wireframe}
            transparent={isInteriorView}
            opacity={isInteriorView ? 0.3 : 1.0}
          />
        </mesh>

        {/* Top Door Lintel */}
        <mesh
          castShadow
          receiveShadow
          position={[0, doorHeight + frontLintelHeight / 2, 0]}
        >
          <boxGeometry args={[doorWidth, frontLintelHeight, wallThickness]} />
          <meshStandardMaterial
            color={wallColor}
            roughness={0.8}
            metalness={0.1}
            wireframe={wireframe}
            transparent={isInteriorView}
            opacity={isInteriorView ? 0.3 : 1.0}
          />
        </mesh>
      </group>

      {/* Optional Insulation Layer visualization (internal core lining) */}
      {showInsulation && (
        <group position={[0, halfH, 0]}>
          {/* North interior insulation */}
          <mesh position={[0, 0, -halfW + wallThickness + 0.02]}>
            <boxGeometry args={[length - 0.4, height - 0.2, 0.04]} />
            <meshStandardMaterial color={insulationColor} roughness={0.9} transparent opacity={0.8} wireframe={wireframe} />
          </mesh>
          {/* West interior insulation */}
          <mesh position={[-halfL + wallThickness + 0.02, 0, 0]}>
            <boxGeometry args={[0.04, height - 0.2, width - 0.4]} />
            <meshStandardMaterial color={insulationColor} roughness={0.9} transparent opacity={0.8} wireframe={wireframe} />
          </mesh>
          {/* East interior insulation */}
          <mesh position={[halfL - wallThickness - 0.02, 0, 0]}>
            <boxGeometry args={[0.04, height - 0.2, width - 0.4]} />
            <meshStandardMaterial color={insulationColor} roughness={0.9} transparent opacity={0.8} wireframe={wireframe} />
          </mesh>
        </group>
      )}
    </group>
  );
}
