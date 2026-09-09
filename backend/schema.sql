-- THERMAL SENSE - Database Schema
-- SIH 2026 - SIH26051
-- Shelter Thermal Simulation & Optimization Software for DRDO / Indian Armed Forces

CREATE DATABASE IF NOT EXISTS thermal_sense CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE thermal_sense;

-- Materials Catalog
CREATE TABLE IF NOT EXISTS materials (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category ENUM('structural', 'insulation', 'finishing', 'glazing') NOT NULL,
  thermal_conductivity DECIMAL(6, 4) NOT NULL COMMENT 'W/(m·K)',
  density DECIMAL(8, 2) NOT NULL COMMENT 'kg/m³',
  specific_heat DECIMAL(8, 2) NOT NULL COMMENT 'J/(kg·K)',
  solar_absorptance DECIMAL(4, 3) NOT NULL DEFAULT 0.600,
  embodied_carbon DECIMAL(6, 2) DEFAULT NULL COMMENT 'kg CO2/kg',
  fire_rating VARCHAR(50) DEFAULT 'Standard',
  moisture_resistance VARCHAR(50) DEFAULT 'Moderate',
  description TEXT,
  practical_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NASA POWER Weather Hourly Cache
CREATE TABLE IF NOT EXISTS weather_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  latitude DECIMAL(8, 5) NOT NULL,
  longitude DECIMAL(8, 5) NOT NULL,
  date_str VARCHAR(10) NOT NULL COMMENT 'YYYY-MM-DD',
  source VARCHAR(50) DEFAULT 'NASA POWER API (Hourly)',
  hourly_data JSON NOT NULL,
  summary JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_location_date (latitude, longitude, date_str)
);

-- Simulations
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
  total_heat_gain DECIMAL(12, 2) NOT NULL COMMENT 'Wh',
  total_heat_loss DECIMAL(12, 2) NOT NULL COMMENT 'Wh',
  heating_demand DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Wh',
  cooling_demand DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Wh',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comparative Designs
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

-- Seed Default Standard Engineering Materials (Generic physical values)
INSERT INTO materials (id, name, category, thermal_conductivity, density, specific_heat, solar_absorptance, description, practical_notes) VALUES
('structural_timber', 'Structural Timber', 'structural', 0.1300, 550.00, 1600.00, 0.650, 'Standard softwood timber framing with favorable strength-to-weight ratio.', 'Thermally favorable option for prefabricated alpine shelters — verify fire, moisture, structural and field requirements before deployment.'),
('brick_masonry', 'Brick Masonry', 'structural', 0.7700, 1800.00, 840.00, 0.700, 'Burnt clay brick masonry with cement mortar.', 'High thermal inertia/mass. Heavy transport logistics; less suitable for extreme forward posts without local kiln — verify structural and field requirements before deployment.'),
('insulated_concrete', 'Insulated Concrete Form (ICF)', 'structural', 0.2200, 1200.00, 1000.00, 0.550, 'Rigid EPS foam forms filled with lightweight reinforced structural concrete.', 'Exceptional airtightness, high structural durability against ballistic/blast fragments, integrated insulation — verify field erection requirements before deployment.'),
('plywood', 'Structural Plywood', 'finishing', 0.1200, 600.00, 1200.00, 0.600, 'Cross-laminated multi-ply veneer interior/exterior sheathing.', 'Rapid assembly, resilient under seismic vibrations — verify moisture barrier and fire requirements before deployment.'),
('eps_insulation', 'Expanded Polystyrene (EPS)', 'insulation', 0.0360, 25.00, 1400.00, 0.300, 'Closed-cell rigid foam board insulation.', 'Cost effective and ultra-lightweight. Moderately moisture sensitive — verify fire, moisture, and protective cladding requirements before deployment.'),
('mineral_wool', 'Mineral Wool (Rockwool)', 'insulation', 0.0400, 80.00, 840.00, 0.400, 'Spun volcanic rock and slag fibrous insulation blanket.', 'Non-combustible (Class A1 fire rating), superior acoustic dampening, favorable for heated shelters — verify moisture and field handling requirements before deployment.'),
('xps_insulation', 'Extruded Polystyrene (XPS)', 'insulation', 0.0300, 35.00, 1500.00, 0.300, 'High-density extruded rigid board with continuous skin.', 'Highest thermal resistance per mm, zero water absorption, ideal for sub-grade permafrost foundations and snowbanks — verify fire and field requirements before deployment.'),
('pir_insulation', 'Polyurethane / PIR Rigid Foam', 'insulation', 0.0240, 32.00, 1450.00, 0.250, 'Closed-cell rigid polyisocyanurate (PIR) foam board insulation.', 'Thermally favorable option with ultra-low thermal conductivity (0.024 W/mK) — verify fire, moisture, structural and field requirements before deployment.'),
('earth_adobe', 'Stabilized Earth / Adobe', 'structural', 0.7500, 1700.00, 950.00, 0.750, 'Sun-dried compressed earth block stabilized with lime/cement.', 'Exceptional thermal dampening (decrement factor), high local availability in Ladakh/Spiti valleys — verify seismic and structural requirements before deployment.'),
('aluminium_cladding', 'Aluminium Sandwich Panel', 'finishing', 0.0500, 45.00, 900.00, 0.200, 'Pre-painted low-emissivity aluminium skins with polyurethane/PIR core.', 'Reflects intense high-altitude solar radiation, quick erection in sub-zero conditions — verify structural wind ratings before deployment.')
ON DUPLICATE KEY UPDATE name=VALUES(name), thermal_conductivity=VALUES(thermal_conductivity), practical_notes=VALUES(practical_notes);
