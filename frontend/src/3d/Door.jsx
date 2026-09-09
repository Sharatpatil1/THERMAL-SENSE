import React from 'react';

export default function Door({
  position = [0, 1.025, 2.0],
  width = 0.95,
  height = 2.05,
  depth = 0.22,
  wireframe = false,
  thermalColor = null
}) {
  const frameThickness = 0.06;
  const panelWidth = width - frameThickness * 2;
  const panelHeight = height - frameThickness;

  const panelColor = thermalColor || '#78350f'; // Insulated timber brown

  return (
    <group position={position}>
      {/* Outer Door Frame */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={thermalColor || '#1e293b'}
          roughness={0.7}
          metalness={0.2}
          wireframe={wireframe}
        />
      </mesh>

      {/* Door Leaf / Panel (slightly proud or recessed) */}
      <mesh castShadow receiveShadow position={[0, -frameThickness / 2, 0.02]}>
        <boxGeometry args={[panelWidth, panelHeight, depth * 0.7]} />
        <meshStandardMaterial
          color={panelColor}
          roughness={0.6}
          metalness={0.1}
          wireframe={wireframe}
        />
      </mesh>

      {/* Decorative recessed panel inserts */}
      <mesh position={[0, 0.4, 0.08]}>
        <boxGeometry args={[panelWidth * 0.75, panelHeight * 0.35, 0.02]} />
        <meshStandardMaterial color={thermalColor || '#451a03'} roughness={0.6} wireframe={wireframe} />
      </mesh>
      <mesh position={[0, -0.4, 0.08]}>
        <boxGeometry args={[panelWidth * 0.75, panelHeight * 0.35, 0.02]} />
        <meshStandardMaterial color={thermalColor || '#451a03'} roughness={0.6} wireframe={wireframe} />
      </mesh>

      {/* Handle Base Escutcheon */}
      <mesh position={[panelWidth / 2 - 0.1, 0, depth * 0.4 + 0.02]}>
        <boxGeometry args={[0.04, 0.14, 0.015]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Lever Handle */}
      <mesh position={[panelWidth / 2 - 0.14, 0, depth * 0.4 + 0.04]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.1, 8]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}
