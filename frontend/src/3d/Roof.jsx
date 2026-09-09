import React from 'react';
import * as THREE from 'three';

export default function Roof({
  length = 6.0,
  width = 4.0,
  wallHeight = 2.8,
  wireframe = false,
  thermalColor = null,
  isInteriorView = false,
  showInsulation = false
}) {
  const roofColor = thermalColor || '#475569'; // Slate roof
  const insulationColor = '#f59e0b'; // Amber insulation

  const overhangX = 0.25;
  const overhangZ = 0.30;
  const roofLength = length + overhangX * 2;
  const halfWidth = width / 2;
  const pitchHeight = 0.85; // 0.85m rise for military field gable
  const slabThickness = 0.12;

  // Slope geometry calculations
  const slopeHypot = Math.sqrt(Math.pow(halfWidth + overhangZ, 2) + Math.pow(pitchHeight, 2));
  const slopeAngle = Math.atan2(pitchHeight, halfWidth + overhangZ);

  // Gable end wall shapes (triangles)
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-halfWidth, 0);
  gableShape.lineTo(halfWidth, 0);
  gableShape.lineTo(0, pitchHeight);
  gableShape.closePath();

  return (
    <group position={[0, wallHeight, 0]}>
      {/* South Slope (Front) */}
      <mesh
        castShadow
        receiveShadow
        position={[0, pitchHeight / 2, (halfWidth + overhangZ) / 2 - overhangZ / 2]}
        rotation={[slopeAngle, 0, 0]}
      >
        <boxGeometry args={[roofLength, slabThickness, slopeHypot]} />
        <meshStandardMaterial
          color={roofColor}
          roughness={0.6}
          metalness={0.2}
          wireframe={wireframe}
          transparent={isInteriorView}
          opacity={isInteriorView ? 0.25 : 1.0}
        />
      </mesh>

      {/* North Slope (Rear) */}
      <mesh
        castShadow
        receiveShadow
        position={[0, pitchHeight / 2, -((halfWidth + overhangZ) / 2 - overhangZ / 2)]}
        rotation={[-slopeAngle, 0, 0]}
      >
        <boxGeometry args={[roofLength, slabThickness, slopeHypot]} />
        <meshStandardMaterial
          color={roofColor}
          roughness={0.6}
          metalness={0.2}
          wireframe={wireframe}
          transparent={isInteriorView}
          opacity={isInteriorView ? 0.35 : 1.0}
        />
      </mesh>

      {/* Ridge Cap Trim */}
      <mesh position={[0, pitchHeight + 0.04, 0]}>
        <boxGeometry args={[roofLength + 0.04, 0.06, 0.18]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} wireframe={wireframe} />
      </mesh>

      {/* West Gable End Wall Triangle */}
      <mesh position={[-length / 2 + 0.01, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <shapeGeometry args={[gableShape]} />
        <meshStandardMaterial
          color={thermalColor || '#94a3b8'}
          roughness={0.8}
          side={THREE.DoubleSide}
          wireframe={wireframe}
        />
      </mesh>

      {/* East Gable End Wall Triangle */}
      <mesh position={[length / 2 - 0.01, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <shapeGeometry args={[gableShape]} />
        <meshStandardMaterial
          color={thermalColor || '#94a3b8'}
          roughness={0.8}
          side={THREE.DoubleSide}
          wireframe={wireframe}
        />
      </mesh>

      {/* Optional Insulation Layer on underside of roof */}
      {showInsulation && (
        <mesh
          position={[0, pitchHeight / 2 - 0.04, 0]}
          rotation={[slopeAngle, 0, 0]}
        >
          <boxGeometry args={[roofLength * 0.96, 0.04, slopeHypot * 0.96]} />
          <meshStandardMaterial
            color={insulationColor}
            roughness={0.9}
            transparent
            opacity={0.85}
            wireframe={wireframe}
          />
        </mesh>
      )}
    </group>
  );
}
