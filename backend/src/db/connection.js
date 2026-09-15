const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

let pool = null;
let isConnected = false;
let memoryFallbackStore = {
  materials: [],
  simulations: new Map(),
  weather_cache: new Map(),
  designs: new Map()
};

const DEFAULT_MATERIALS = [
  {
    id: 'structural_timber',
    name: 'Structural Timber',
    category: 'structural',
    thermal_conductivity: 0.1300,
    density: 550.00,
    specific_heat: 1600.00,
    solar_absorptance: 0.650,
    description: 'Standard softwood timber framing with favorable strength-to-weight ratio.',
    practical_notes: 'Thermally favorable option for prefabricated alpine shelters — verify fire, moisture, structural and field requirements before deployment.'
  },
  {
    id: 'brick_masonry',
    name: 'Brick Masonry',
    category: 'structural',
    thermal_conductivity: 0.7700,
    density: 1800.00,
    specific_heat: 840.00,
    solar_absorptance: 0.700,
    description: 'Burnt clay brick masonry with cement mortar.',
    practical_notes: 'High thermal inertia/mass. Heavy transport logistics; less suitable for extreme forward posts without local kiln — verify structural and field requirements before deployment.'
  },
  {
    id: 'insulated_concrete',
    name: 'Insulated Concrete Form (ICF)',
    category: 'structural',
    thermal_conductivity: 0.2200,
    density: 1200.00,
    specific_heat: 1000.00,
    solar_absorptance: 0.550,
    description: 'Rigid EPS foam forms filled with lightweight reinforced structural concrete.',
    practical_notes: 'Exceptional airtightness, high structural durability against ballistic/blast fragments, integrated insulation — verify field erection requirements before deployment.'
  },
  {
    id: 'plywood',
    name: 'Structural Plywood',
    category: 'finishing',
    thermal_conductivity: 0.1200,
    density: 600.00,
    specific_heat: 1200.00,
    solar_absorptance: 0.600,
    description: 'Cross-laminated multi-ply veneer interior/exterior sheathing.',
    practical_notes: 'Rapid assembly, resilient under seismic vibrations — verify moisture barrier and fire requirements before deployment.'
  },
  {
    id: 'eps_insulation',
    name: 'Expanded Polystyrene (EPS)',
    category: 'insulation',
    thermal_conductivity: 0.0360,
    density: 25.00,
    specific_heat: 1400.00,
    solar_absorptance: 0.300,
    description: 'Closed-cell rigid foam board insulation.',
    practical_notes: 'Cost effective and ultra-lightweight. Moderately moisture sensitive — verify fire, moisture, and protective cladding requirements before deployment.'
  },
  {
    id: 'mineral_wool',
    name: 'Mineral Wool (Rockwool)',
    category: 'insulation',
    thermal_conductivity: 0.0400,
    density: 80.00,
    specific_heat: 840.00,
    solar_absorptance: 0.400,
    description: 'Spun volcanic rock and slag fibrous insulation blanket.',
    practical_notes: 'Non-combustible (Class A1 fire rating), superior acoustic dampening, favorable for heated operational shelters — verify moisture and field handling requirements before deployment.'
  },
  {
    id: 'xps_insulation',
    name: 'Extruded Polystyrene (XPS)',
    category: 'insulation',
    thermal_conductivity: 0.0300,
    density: 35.00,
    specific_heat: 1500.00,
    solar_absorptance: 0.300,
    description: 'High-density extruded rigid board with continuous skin.',
    practical_notes: 'Highest thermal resistance per mm, zero water absorption, ideal for sub-grade permafrost foundations and snowbanks — verify fire and field requirements before deployment.'
  },
  {
    id: 'pir_insulation',
    name: 'Polyurethane / PIR Rigid Foam',
    category: 'insulation',
    thermal_conductivity: 0.0240,
    density: 32.00,
    specific_heat: 1450.00,
    solar_absorptance: 0.250,
    description: 'Closed-cell rigid polyisocyanurate (PIR) foam board insulation.',
    practical_notes: 'Thermally favorable option with ultra-low thermal conductivity (0.024 W/mK) — verify fire, moisture, structural and field requirements before deployment.'
  },
  {
    id: 'earth_adobe',
    name: 'Stabilized Earth / Adobe',
    category: 'structural',
    thermal_conductivity: 0.7500,
    density: 1700.00,
    specific_heat: 950.00,
    solar_absorptance: 0.750,
    description: 'Sun-dried compressed earth block stabilized with lime/cement.',
    practical_notes: 'Exceptional thermal dampening (decrement factor), high local availability in Ladakh/Spiti valleys — verify seismic and structural requirements before deployment.'
  },
  {
    id: 'aluminium_cladding',
    name: 'Aluminium Sandwich Panel',
    category: 'finishing',
    thermal_conductivity: 0.0500,
    density: 45.00,
    specific_heat: 900.00,
    solar_absorptance: 0.200,
    description: 'Pre-painted low-emissivity aluminium skins with polyurethane/PIR core.',
    practical_notes: 'Reflects intense high-altitude solar radiation, quick erection in sub-zero conditions — verify structural wind ratings before deployment.'
  }
];

// Initialize memory fallback store
memoryFallbackStore.materials = [...DEFAULT_MATERIALS];

async function initializeDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'thermal_sense';

  try {
    const initConn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      connectTimeout: 2000
    });

    await initConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await initConn.end();

    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 3000
    });

    await pool.query('SELECT 1 + 1 AS test');
    isConnected = true;
    console.log(`[Database] Connected successfully to MySQL (${database} on ${host}:${port})`);

    await createTablesIfNotExist();
    await seedMaterialsIfEmpty();

  } catch (err) {
    console.warn(`[Database Info] MySQL connection status: ${err.message}. Using resilient in-memory database store.`);
    isConnected = false;
  }
}

async function createTablesIfNotExist() {
  if (!pool) return;
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS materials (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      category ENUM('structural', 'insulation', 'finishing', 'glazing') NOT NULL,
      thermal_conductivity DECIMAL(6, 4) NOT NULL,
      density DECIMAL(8, 2) NOT NULL,
      specific_heat DECIMAL(8, 2) NOT NULL,
      solar_absorptance DECIMAL(4, 3) NOT NULL DEFAULT 0.600,
      embodied_carbon DECIMAL(6, 2) DEFAULT NULL,
      fire_rating VARCHAR(50) DEFAULT 'Standard',
      moisture_resistance VARCHAR(50) DEFAULT 'Moderate',
      description TEXT,
      practical_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS weather_cache (
      id INT AUTO_INCREMENT PRIMARY KEY,
      latitude DECIMAL(8, 5) NOT NULL,
      longitude DECIMAL(8, 5) NOT NULL,
      date_str VARCHAR(10) NOT NULL,
      source VARCHAR(50) DEFAULT 'NASA POWER API (Hourly)',
      hourly_data JSON NOT NULL,
      summary JSON DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_location_date (latitude, longitude, date_str)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS simulations (
      id VARCHAR(64) PRIMARY KEY,
      simulation_name VARCHAR(150) NOT NULL,
      location_name VARCHAR(150) NOT NULL,
      latitude DECIMAL(8, 5) NOT NULL,
      longitude DECIMAL(8, 5) NOT NULL,
      date_simulated VARCHAR(10) NOT NULL,
      weather_source VARCHAR(100) NOT NULL,
      design_parameters JSON NOT NULL,
      materials_used JSON NOT NULL,
      simulation_results JSON NOT NULL,
      thermal_score DECIMAL(5, 2) NOT NULL,
      comfort_percent DECIMAL(5, 2) NOT NULL,
      avg_indoor_temp DECIMAL(5, 2) NOT NULL,
      min_indoor_temp DECIMAL(5, 2) NOT NULL,
      max_indoor_temp DECIMAL(5, 2) NOT NULL,
      total_heat_gain DECIMAL(12, 2) NOT NULL,
      total_heat_loss DECIMAL(12, 2) NOT NULL,
      heating_demand DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      cooling_demand DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS designs (
      id VARCHAR(64) PRIMARY KEY,
      design_name VARCHAR(150) NOT NULL,
      simulation_id VARCHAR(64) NULL,
      dimensions JSON NOT NULL,
      wall_material_id VARCHAR(50) NOT NULL,
      roof_material_id VARCHAR(50) NOT NULL,
      insulation_material_id VARCHAR(50) NOT NULL,
      insulation_thickness_mm INT NOT NULL,
      orientation VARCHAR(10) NOT NULL,
      u_value DECIMAL(6, 4) NOT NULL,
      comfort_percent DECIMAL(5, 2) NOT NULL,
      thermal_score DECIMAL(5, 2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE SET NULL
    );
  `);
}

async function seedMaterialsIfEmpty() {
  if (!pool) return;
  const [rows] = await pool.query('SELECT COUNT(*) as count FROM materials');
  if (rows[0].count === 0) {
    console.log('[Database] Seeding standard engineering materials...');
    for (const m of DEFAULT_MATERIALS) {
      await pool.query(
        `INSERT INTO materials (id, name, category, thermal_conductivity, density, specific_heat, solar_absorptance, description, practical_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [m.id, m.name, m.category, m.thermal_conductivity, m.density, m.specific_heat, m.solar_absorptance, m.description, m.practical_notes]
      );
    }
  }
}

async function query(sql, params = []) {
  if (isConnected && pool) {
    try {
      const [rows] = await pool.query(sql, params);
      return rows;
    } catch (err) {
      console.error('[Database Query Error]', err.message);
      throw err;
    }
  }
  return null;
}

function getMemoryStore() {
  return memoryFallbackStore;
}

function getStatus() {
  return {
    connected: isConnected,
    mode: isConnected ? 'MySQL Connected' : 'In-Memory Fallback Store (Local Demo)',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'thermal_sense',
    note: isConnected ? 'Production MySQL' : 'Database server unavailable or password not configured in .env; operating in memory'
  };
}

module.exports = {
  initializeDatabase,
  query,
  getStatus,
  getMemoryStore,
  DEFAULT_MATERIALS
};
