import React from 'react';

export default function Foundation({ length = 6, width = 4, wireframe = false, color = '#334155' }) {
  // Foundation plinth sits slightly wider than the building
  const plinthLength = length + 0.4;
  const plinthWidth = width + 0.4;
  const plinthHeight = 0.3; // 30cm thick concrete base

  return (
    <group position={[0, -plinthHeight / 2, 0]}>
      {/* Heavy concrete plinth */}
      <mesh receiveShadow castShadow>
        <boxGeometry args={[plinthLength, plinthHeight, plinthWidth]} />
        <meshStandardMaterial
          color={color}
          roughness={0.9}
          metalness={0.1}
          wireframe={wireframe}
        />
      </mesh>

      {/* Perimeter edge chamfer detail */}
      <mesh position={[0, plinthHeight / 2, 0]}>
        <boxGeometry args={[plinthLength + 0.05, 0.04, plinthWidth + 0.05]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.8}
          wireframe={wireframe}
        />
      </mesh>
    </group>
  );
}
