import React from 'react';

export default function Window({
  position = [0, 1.6, 2.0],
  width = 1.0,
  height = 1.1,
  depth = 0.22,
  wireframe = false,
  thermalColor = null
}) {
  const frameThickness = 0.05;
  const glassWidth = width - frameThickness * 2;
  const glassHeight = height - frameThickness * 2;

  return (
    <group position={position}>
      {/* Outer Window Casement Frame */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={thermalColor || '#1e293b'}
          roughness={0.7}
          metalness={0.3}
          wireframe={wireframe}
        />
      </mesh>

      {/* Glass Pane */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[glassWidth, glassHeight, 0.02]} />
        <meshStandardMaterial
          color={thermalColor || '#38bdf8'}
          roughness={0.1}
          metalness={0.1}
          transparent={!thermalColor}
          opacity={thermalColor ? 1.0 : 0.45}
          wireframe={wireframe}
        />
      </mesh>

      {/* Divided Panes: Vertical Muntin Bar */}
      <mesh position={[0, 0, 0.015]}>
        <boxGeometry args={[0.025, glassHeight, 0.03]} />
        <meshStandardMaterial color={thermalColor || '#334155'} roughness={0.7} wireframe={wireframe} />
      </mesh>

      {/* Divided Panes: Horizontal Muntin Bar */}
      <mesh position={[0, 0, 0.015]}>
        <boxGeometry args={[glassWidth, 0.025, 0.03]} />
        <meshStandardMaterial color={thermalColor || '#334155'} roughness={0.7} wireframe={wireframe} />
      </mesh>

      {/* Exterior Window Sill */}
      <mesh position={[0, -height / 2 - 0.02, depth / 2 + 0.04]}>
        <boxGeometry args={[width + 0.1, 0.04, 0.12]} />
        <meshStandardMaterial color="#475569" roughness={0.8} wireframe={wireframe} />
      </mesh>
    </group>
  );
}
