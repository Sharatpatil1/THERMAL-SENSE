const db = require('../db/connection');

async function getAllMaterials() {
  const store = db.getMemoryStore();
  const dbStatus = db.getStatus();

  if (dbStatus.connected) {
    try {
      const rows = await db.query('SELECT * FROM materials ORDER BY category, name ASC');
      if (rows && rows.length > 0) {
        return rows.map(r => ({
          ...r,
          thermal_conductivity: Number(r.thermal_conductivity),
          density: Number(r.density),
          specific_heat: Number(r.specific_heat),
          solar_absorptance: Number(r.solar_absorptance)
        }));
      }
    } catch (err) {
      console.warn('[MaterialService] Query failed, using memory store:', err.message);
    }
  }

  return store.materials;
}

async function getMaterialById(id) {
  const materials = await getAllMaterials();
  return materials.find(m => m.id === id) || null;
}

/**
 * Calculates composite U-value (W/m²·K) and areal thermal capacitance (J/m²·K)
 * for a building envelope assembly consisting of structural layer + insulation layer.
 * 
 * R_total = R_si + (d_struct / k_struct) + (d_insul / k_insul) + R_se
 * U = 1 / R_total
 */
function calculateAssemblyProperties({
  structuralMaterial,
  structuralThicknessM = 0.20,
  insulationMaterial,
  insulationThicknessM = 0.10,
  assemblyType = 'wall' // 'wall', 'roof', 'floor'
}) {
  // ISO 6946 standard surface resistances (m²·K/W)
  let R_si = 0.13; // default wall
  let R_se = 0.04;

  if (assemblyType === 'roof') {
    R_si = 0.10; // upward heat flow
    R_se = 0.04;
  } else if (assemblyType === 'floor') {
    R_si = 0.17; // downward heat flow
    R_se = 0.00; // ground contact or sub-grade
  }

  const R_struct = structuralMaterial && structuralMaterial.thermal_conductivity > 0
    ? (structuralThicknessM / structuralMaterial.thermal_conductivity)
    : 0;

  const R_insul = insulationMaterial && insulationMaterial.thermal_conductivity > 0
    ? (insulationThicknessM / insulationMaterial.thermal_conductivity)
    : 0;

  const R_total = R_si + R_struct + R_insul + R_se;
  const U_value = R_total > 0 ? (1 / R_total) : 2.5; // fallback W/m²K

  // Areal thermal capacitance (J/m²·K)
  const cap_struct = (structuralMaterial ? (structuralThicknessM * structuralMaterial.density * structuralMaterial.specific_heat) : 0);
  const cap_insul = (insulationMaterial ? (insulationThicknessM * insulationMaterial.density * insulationMaterial.specific_heat) : 0);
  const arealCapacitance = cap_struct + cap_insul;

  return {
    R_total: Number(R_total.toFixed(4)),
    U_value: Number(U_value.toFixed(4)),
    arealCapacitance: Number(arealCapacitance.toFixed(2)),
    R_struct: Number(R_struct.toFixed(4)),
    R_insul: Number(R_insul.toFixed(4))
  };
}

module.exports = {
  getAllMaterials,
  getMaterialById,
  calculateAssemblyProperties
};
