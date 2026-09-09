import React from 'react';

export default function InteriorElements({ occupancy = 6 }) {
  return (
    <group position={[0, 0, 0]}>
      {/* 1. Military Bunk Bed 1 (Rear Left) */}
      <group position={[-1.8, 0, -1.2]}>
        {/* Metal frame posts */}
        <mesh position={[-0.45, 0.8, -0.95]}>
          <boxGeometry args={[0.04, 1.6, 0.04]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0.45, 0.8, -0.95]}>
          <boxGeometry args={[0.04, 1.6, 0.04]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[-0.45, 0.8, 0.95]}>
          <boxGeometry args={[0.04, 1.6, 0.04]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0.45, 0.8, 0.95]}>
          <boxGeometry args={[0.04, 1.6, 0.04]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Lower Bunk Mattress */}
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[0.85, 0.15, 1.85]} />
          <meshStandardMaterial color="#3f6212" roughness={0.8} /> {/* Olive green field bedding */}
        </mesh>
        {/* Pillow */}
        <mesh position={[0, 0.55, -0.7]}>
          <boxGeometry args={[0.7, 0.1, 0.35]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.7} />
        </mesh>

        {/* Upper Bunk Mattress */}
        <mesh position={[0, 1.25, 0]}>
          <boxGeometry args={[0.85, 0.15, 1.85]} />
          <meshStandardMaterial color="#3f6212" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.35, -0.7]}>
          <boxGeometry args={[0.7, 0.1, 0.35]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.7} />
        </mesh>
      </group>

      {/* 2. Tactical Radio & Operations Desk (Rear Right) */}
      <group position={[1.8, 0, -1.2]}>
        {/* Desk Surface */}
        <mesh position={[0, 0.75, 0]}>
          <boxGeometry args={[1.4, 0.05, 0.8]} />
          <meshStandardMaterial color="#475569" roughness={0.5} />
        </mesh>
        {/* Desk Legs */}
        <mesh position={[-0.6, 0.375, -0.3]}>
          <boxGeometry args={[0.05, 0.75, 0.05]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0.6, 0.375, -0.3]}>
          <boxGeometry args={[0.05, 0.75, 0.05]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[-0.6, 0.375, 0.3]}>
          <boxGeometry args={[0.05, 0.75, 0.05]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0.6, 0.375, 0.3]}>
          <boxGeometry args={[0.05, 0.75, 0.05]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>

        {/* Computer Screen */}
        <mesh position={[0, 1.05, -0.15]}>
          <boxGeometry args={[0.5, 0.32, 0.03]} />
          <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.3} />
        </mesh>
        {/* Monitor stand */}
        <mesh position={[0, 0.85, -0.15]}>
          <cylinderGeometry args={[0.02, 0.04, 0.15, 8]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>

      {/* 3. Field Environmental Heater / ECU unit (Center side) */}
      <group position={[-2.2, 0, 0.5]}>
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[0.5, 0.9, 0.5]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.4} /> {/* Safety Red field heater */}
        </mesh>
        {/* Exhaust pipe */}
        <mesh position={[0, 1.1, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.5, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
      </group>

      {/* 4. Occupant Markers (Troop Silhouettes) */}
      {Array.from({ length: Math.min(6, occupancy) }).map((_, idx) => {
        const xPos = -0.6 + (idx % 3) * 0.6;
        const zPos = 0.2 + Math.floor(idx / 3) * 0.7;
        return (
          <group key={idx} position={[xPos, 0, zPos]}>
            {/* Body Capsule */}
            <mesh position={[0, 0.85, 0]}>
              <capsuleGeometry args={[0.18, 0.8, 8, 16]} />
              <meshStandardMaterial color="#4d7c0f" roughness={0.7} /> {/* Camouflage olive */}
            </mesh>
            {/* Tactical Helmet / Head */}
            <mesh position={[0, 1.55, 0]}>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial color="#15803d" roughness={0.8} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
