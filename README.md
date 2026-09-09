# THERMAL SENSE

> **Smart Shelters. Safer Missions.**  
> **SIH 2026 – SIH26051** | Decision-Support Prototype for DRDO / Indian Armed Forces

---

## 1. Project Overview

**THERMAL SENSE** is an advanced full-stack engineering and thermodynamic simulation software designed to assist engineers, architects, and military logistics planners in evaluating, simulating, and optimizing the thermal comfort of personnel field shelters deployed in extreme environments (e.g., high-altitude alpine border posts in Leh/Ladakh and Siachen, or extreme desert outposts in Rajasthan).

The application integrates:
1. **Current live weather data** from **Open-Meteo** current conditions, with satellite solar-radiation data when available, plus a 24-hour hourly weather-model window for thermal simulation. **NASA POWER remains available for historical climate analysis.**
2. **Transparent transient lumped-capacitance thermodynamic engine** modeling building conduction, air infiltration, fenestration aperture solar gains, occupant metabolic heat, and nocturnal long-wave sky radiative cooling.
3. **Realistic 3D CAD visualization** built on **Three.js, React Three Fiber, and Drei**, featuring solid foundations, realistic wall thicknesses, a sloped gable roof with eaves overhangs, centered doors, divided pane windows, an interactive orientation compass, and real-time surface thermal color mapping.
4. **Automated multi-objective parametric optimization** evaluating insulation materials, thicknesses ($50\text{ mm} - 200\text{ mm}$), and orientations to maximize occupant thermal comfort within the standard $18^\circ\text{C} - 27^\circ\text{C}$ temperature band.
5. **Formal Engineering PDF Report Generator** generating downloadable mission dossiers complete with tables, metrics, and disclaimers.

---

## 2. Engineering Equations & Mathematical Formulation

### 2.1 Envelope Thermal Resistance & U-Values (ISO 6946)
For each layered envelope assembly:
$$R_{\text{total}} = R_{si} + \sum_{i=1}^{n} \frac{d_i}{k_i} + R_{se}$$
$$U = \frac{1}{R_{\text{total}}} \quad \left[\text{W/m}^2\cdot\text{K}\right]$$
- $R_{si}$: Indoor surface boundary resistance ($0.13\text{ m}^2\cdot\text{K/W}$ for vertical walls, $0.10$ for upward heat flow through roofs).
- $R_{se}$: Outdoor surface boundary resistance ($0.04\text{ m}^2\cdot\text{K/W}$).

### 2.2 Conduction Heat Transfer ($Q_{\text{cond}}$)
$$Q_{\text{cond}}(t) = \sum_{j} \left(U_j \cdot A_j\right) \cdot \left(T_{\text{outdoor}}(t) - T_{\text{indoor}}(t)\right)$$

### 2.3 Air Infiltration Heat Exchange ($Q_{\text{infilt}}$)
Accounting for dynamic local wind velocity $WS_{10M}$:
$$\text{ACH}_{\text{eff}}(t) = \text{ACH}_{\text{base}} \cdot \left(1 + 0.04 \cdot WS_{10M}(t)\right)$$
$$Q_{\text{infilt}}(t) = \frac{\rho_{\text{air}} \cdot C_{p,\text{air}} \cdot \text{ACH}_{\text{eff}}(t) \cdot V_{\text{shelter}}}{3600} \cdot \left(T_{\text{outdoor}}(t) - T_{\text{indoor}}(t)\right)$$
- $\rho_{\text{air}} = 1.204\text{ kg/m}^3$
- $C_{p,\text{air}} = 1005\text{ J/kg}\cdot\text{K}$

### 2.4 Solar Heat Gain ($Q_{\text{solar}}$)
$$Q_{\text{solar}}(t) = I_{\text{solar}}(t) \cdot A_{\text{window}} \cdot \text{SHGC} \cdot \eta_{\text{orient}}(t) + \alpha_{\text{roof}} \cdot I_{\text{solar}}(t) \cdot A_{\text{roof}} \cdot \left(\frac{U_{\text{roof}}}{h_o}\right)$$

### 2.5 Internal Gains ($Q_{\text{internal}}$)
$$Q_{\text{internal}} = \left(N_{\text{occupants}} \times 100\,\text{W}\right) + P_{\text{equipment}} + P_{\text{lighting}}$$

### 2.6 Transient Numerical State Update ($dt = 3600\text{ s}$)
$$T_{\text{indoor}}(t + \Delta t) = T_{\text{indoor}}(t) + \frac{Q_{\text{net}}(t) \cdot \Delta t}{C_{\text{total}}}$$
where:
$$C_{\text{total}} = \left(\rho_{\text{air}} \cdot C_{p,\text{air}} \cdot V\right) + f_{\text{eff}} \cdot \sum \left(A_j \cdot d_j \cdot \rho_j \cdot C_{p,j}\right) + C_{\text{contents}}$$

### 2.7 Comfort Percentage & Indicator
$$\text{Comfort \%} = \frac{\sum_{t=0}^{23} \left[18^\circ\text{C} \le T_{\text{indoor}}(t) \le 27^\circ\text{C}\right]}{24} \times 100$$

---

## 3. Technology Stack

- **Frontend**:
  - React 18, Vite
  - Three.js, React Three Fiber (`@react-three/fiber`), Drei (`@react-three/drei`)
  - Recharts (Interactive SVG curves and area charts)
  - jsPDF & jsPDF-AutoTable (Client-side instant report generation)
  - Lucide React (Tactical UI icons)
  - Modular Scoped CSS with CSS variables
- **Backend**:
  - Node.js 20+ / Express REST API
  - Axios (Open-Meteo + NASA POWER API communication)
  - Joi (Input validation schemas)
  - MySQL2 (Connection pooling with parameterized queries and resilient in-memory fallback)
  - PDFKit & PDFKit-Table (Server-side streaming PDF reports)
- **Containerization**:
  - Docker & Docker Compose (Multi-stage builds with Nginx and MySQL 8.0)

---

## 4. Directory Structure

```
thermal-sense/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   └── connection.js      # MySQL connection pool & memory fallback
│   │   ├── routes/
│   │   │   ├── materialRoutes.js  # GET /api/materials
│   │   │   ├── optimizationRoutes.js # POST /api/optimize
│   │   │   ├── simulationRoutes.js   # POST /api/simulate, CRUD, PDF
│   │   │   ├── weatherRoutes.js   # GET /api/weather (NASA POWER historical)
│   │   │   └── liveWeatherRoutes.js # GET /api/weather/live (current weather)
│   │   ├── services/
│   │   │   ├── materialService.js
│   │   │   ├── optimizationService.js
│   │   │   ├── reportService.js
│   │   │   └── weatherService.js  # NASA POWER client & cache
│   │   ├── thermal/
│   │   │   └── thermalModel.js    # Transient lumped-capacitance engine
│   │   ├── utils/
│   │   │   └── validation.js      # Joi schemas
│   │   └── server.js              # Express entrypoint
│   ├── tests/
│   │   ├── thermalModel.test.js   # Mathematical unit tests
│   │   └── integration.test.js    # Full end-to-end API tests
│   ├── Dockerfile
│   ├── schema.sql                 # MySQL schema
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── 3d/
│   │   │   ├── Compass.jsx        # Dynamic 3D orientation compass
│   │   │   ├── Door.jsx           # Centered door with frame & handle
│   │   │   ├── Foundation.jsx     # Plinth base
│   │   │   ├── InteriorElements.jsx # Bunks, desk, heater, occupants
│   │   │   ├── Roof.jsx           # Pitched sloped gable roof with eaves
│   │   │   ├── ShelterBuilding.jsx # Complete assembly
│   │   │   ├── ShelterCanvas.jsx  # OrbitControls, lights, view modes
│   │   │   ├── TemperatureLegend.jsx # Clear non-collapsing legend
│   │   │   ├── ThermalColorMap.js # Continuous RGB heat colormap
│   │   │   └── Window.jsx         # Divided panes & glass
│   │   ├── components/
│   │   │   ├── ComparisonModal.jsx
│   │   │   ├── Header.jsx         # Military branding & disclaimers
│   │   │   ├── Sidebar.jsx        # Pipeline navigation
│   │   │   └── WeatherCard.jsx    # Real NASA POWER data badge
│   │   ├── pages/
│   │   │   ├── DashboardHome.jsx
│   │   │   ├── LocationClimate.jsx
│   │   │   ├── Materials.jsx
│   │   │   ├── Optimization.jsx
│   │   │   ├── SavedReports.jsx
│   │   │   ├── Shelter3DPage.jsx
│   │   │   ├── ShelterDesign.jsx
│   │   │   └── ThermalResults.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── reportService.js
│   │   │   ├── simulationService.js
│   │   │   └── weatherService.js
│   │   ├── styles/
│   │   │   ├── index.css
│   │   │   └── theme.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── docker-compose.yml
├── README.md
└── .gitignore
```

---

## 5. Quickstart & Installation

### 5.1 Prerequisites
- **Node.js**: v20.x or higher (`node -v`)
- **npm**: v10.x or higher
- Optional: **MySQL 8.0** or Docker.

### 5.2 Local Installation

```bash
# 1. Clone or enter project directory
cd thermal-sense

# 2. Setup backend
cd backend
npm install
cp .env.example .env

# 3. Setup frontend
cd ../frontend
npm install
```

### 5.3 Running Tests
Verify the mathematical model and API integration:
```bash
# In backend directory
npm test
node tests/integration.test.js
```

### 5.4 Starting the Application

**Terminal 1 (Backend API):**
```bash
cd backend
npm start
# Server listens on http://localhost:5000
```

**Terminal 2 (Frontend Dev Server):**
```bash
cd frontend
npm run dev
# Vite dev server available at http://localhost:5173
```

### 5.5 Docker Deployment
Run everything (MySQL, Node API, Nginx frontend) with a single command:
```bash
docker-compose up --build
```
Access the application at `http://localhost:5173`.

---

## 6. Weather Data Architecture

### 6.1 Live weather — `/api/weather/live`

The application now uses **Open-Meteo** for the live dashboard and current-condition workflow. Open-Meteo provides current conditions and frequently updated weather-model data without an API key for non-commercial use. Its current conditions include temperature, relative humidity and 10 m wind speed; the hourly model also provides shortwave solar radiation.

For the current solar value, the backend also queries the Open-Meteo Satellite Radiation API when coverage is available. Satellite radiation provides instantaneous irradiance data and is intended for near-real-time solar monitoring.

Endpoint:
`GET /api/weather/live?latitude=17.3297&longitude=76.8343`

The response contains:
- current timestamp
- current temperature (°C)
- current relative humidity (%)
- current wind speed (m/s)
- current solar radiation (W/m²) when satellite coverage is available
- 24 local hourly records for the current date
- data-source/provenance fields
- `syntheticFallbackUsed: false`

The backend never fabricates a missing current solar measurement.

### 6.2 Historical climate — `/api/weather`

NASA POWER remains available for historical hourly climate analysis and validation:
- **Base Endpoint**: `https://power.larc.nasa.gov/api/temporal/hourly/point`
- **Parameters**: `T2M`, `RH2M`, `WS10M`, `ALLSKY_SFC_SW_DWN`
- **User Community**: `SB` (Sustainable Buildings)
- **Time Standard**: `LST` (Local Solar Time)
- **Format**: JSON, requiring 24 verified hourly records.
- **Data Policy**: Strict validation; incomplete NASA records are rejected rather than fabricated.

### 6.3 Important accuracy note

"Live" here means **provider current conditions / near-real-time model and satellite data**, not a physical thermometer or an on-site weather station. For deployment-grade tactical use, the system should ingest calibrated local station/sensor data when available.

---

## 7. Engineering Notice & Prototype Disclaimer

> [!CAUTION]
> **Decision-Support Simulation Prototype (SIH 2026 – SIH26051)**:  
> This software is an engineering research prototype developed for academic and decision-support demonstration purposes. It does **not** constitute an official military certification by DRDO or the Ministry of Defence, Government of India.  
> Transient lumped-capacitance simulation outputs are numerical approximations. Prior to physical shelter fabrication or tactical deployment in forward conflict/alpine zones, all designs must be verified against certified laboratory thermal test certificates, localized micro-topographical meteorological stations, and applicable Bureau of Indian Standards (BIS) / DRDO structural and life-safety codes.
