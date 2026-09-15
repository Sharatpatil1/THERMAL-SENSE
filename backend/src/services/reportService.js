const PDFDocument = require('pdfkit');

/**
 * Generates a clean, professional military-engineering PDF report for Thermal Sense.
 */
function generatePdfReport(simulationData, res) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    info: {
      Title: `THERMAL SENSE - Simulation Report - ${simulationData.location_name || 'Field Shelter'}`,
      Author: 'Thermal Sense Engineering Decision-Support System',
      Subject: 'Shelter Thermal Simulation & Optimization for DRDO / Indian Armed Forces'
    }
  });

  doc.pipe(res);

  const colors = {
    navy: '#0b192c',
    teal: '#1e40af',
    dark: '#1e293b',
    gray: '#64748b',
    lightBg: '#f8fafc',
    accentGreen: '#059669',
    border: '#cbd5e1'
  };

  // Header Banner
  doc.rect(40, 40, 515, 65).fill(colors.navy);

  doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text('THERMAL SENSE', 55, 52);
  doc.fontSize(9).font('Helvetica').fillColor('#94a3b8').text('Smart Shelters. Safer Missions. | Decision-Support Simulation Prototype', 55, 73);
  doc.fontSize(8).fillColor('#38bdf8').text('SIH 2026 – SIH26051 | Research Prototype for DRDO & Indian Armed Forces', 55, 85);

  const genDate = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  doc.fontSize(8).fillColor('#cbd5e1').text(`Generated: ${genDate}`, 350, 52, { align: 'right', width: 190 });
  doc.fontSize(8).fillColor('#94a3b8').text(`Simulation ID: ${simulationData.id || 'SIM-PREVIEW'}`, 350, 65, { align: 'right', width: 190 });

  doc.moveDown(3.5);

  // Section 1: Executive Summary & Passive vs Active Performance
  let currentY = 120;
  doc.rect(40, currentY, 515, 85).fillAndStroke(colors.lightBg, colors.border);

  doc.fillColor(colors.navy).fontSize(10.5).font('Helvetica-Bold').text('1. EXECUTIVE THERMAL & HVAC SIZING SUMMARY', 50, currentY + 8);

  const summary = (simulationData.simulation_results && simulationData.simulation_results.summary)
    ? simulationData.simulation_results.summary : {};

  const thermalScore = simulationData.thermal_score || summary.thermalScore || 0;
  const comfortPct = simulationData.comfort_percent || summary.comfortPercentage || 0;
  const avgIndoor = simulationData.avg_indoor_temp || summary.avgIndoorTemp || 0;
  const outdoorAvg = summary.outdoorAvgTemp !== undefined ? summary.outdoorAvgTemp : 'N/A';
  const heatDemand = summary.totalHeatingDemandKwh !== undefined ? summary.totalHeatingDemandKwh : (simulationData.heating_demand || 0);
  const coolDemand = summary.totalCoolingDemandKwh !== undefined ? summary.totalCoolingDemandKwh : (simulationData.cooling_demand || 0);
  const peakHeat = summary.peakHeatingLoadKw !== undefined ? summary.peakHeatingLoadKw : 0;

  doc.fontSize(8.5).font('Helvetica').fillColor(colors.dark);
  doc.text(`Temperature Comfort Score:`, 50, currentY + 26);
  doc.font('Helvetica-Bold').fillColor(thermalScore > 60 ? colors.accentGreen : '#d97706').text(`${thermalScore} / 100`, 185, currentY + 26);

  doc.font('Helvetica').fillColor(colors.dark).text(`Comfort Hours (18°C - 27°C):`, 50, currentY + 39);
  doc.font('Helvetica-Bold').text(`${comfortPct}% (${summary.comfortHours || Math.round(comfortPct * 24 / 100)} of 24 hrs)`, 185, currentY + 39);

  doc.font('Helvetica').fillColor(colors.dark).text(`Average Floating Indoor Temp:`, 50, currentY + 52);
  doc.font('Helvetica-Bold').text(`${avgIndoor} °C (Min: ${summary.minIndoorTemp || 0}°C, Max: ${summary.maxIndoorTemp || 0}°C)`, 185, currentY + 52);

  doc.font('Helvetica').fillColor(colors.dark).text(`Active Heating Energy Demand:`, 310, currentY + 26);
  doc.font('Helvetica-Bold').fillColor('#b91c1c').text(`${heatDemand} kWh/day (Peak: ${peakHeat} kW)`, 445, currentY + 26);

  doc.font('Helvetica').fillColor(colors.dark).text(`Active Cooling Energy Demand:`, 310, currentY + 39);
  doc.font('Helvetica-Bold').fillColor('#0284c7').text(`${coolDemand} kWh/day`, 445, currentY + 39);

  doc.font('Helvetica').fillColor(colors.dark).text(`NASA Outdoor Climate Mean:`, 310, currentY + 52);
  doc.font('Helvetica-Bold').fillColor(colors.dark).text(`${outdoorAvg} °C`, 445, currentY + 52);

  doc.fontSize(7.5).font('Helvetica-Oblique').fillColor(colors.gray).text(
    '* Distinction: Passive performance denotes free-floating indoor temperature without auxiliary heating; Active demand calculates energy required to maintain 18°C - 27°C setpoints.',
    50, currentY + 68, { width: 495 }
  );

  // Section 2: Location & NASA POWER Climate Data
  currentY += 95;
  doc.rect(40, currentY, 515, 60).fillAndStroke(colors.lightBg, colors.border);
  doc.fillColor(colors.navy).fontSize(10.5).font('Helvetica-Bold').text('2. GEOGRAPHIC LOCATION & NASA POWER CLIMATE DATA', 50, currentY + 8);

  doc.fontSize(8.5).font('Helvetica').fillColor(colors.dark);
  doc.text(`Location Station: ${simulationData.location_name || 'Leh, Ladakh, India'}`, 50, currentY + 25);
  doc.text(`Coordinates: Latitude ${simulationData.latitude}°, Longitude ${simulationData.longitude}°`, 50, currentY + 39);

  doc.text(`Observation Date: ${simulationData.date_simulated || '2025-01-15'}`, 300, currentY + 25);
  doc.text(`Climate Source: NASA POWER API (Hourly Point, LST Verified)`, 300, currentY + 39);

  // Section 3: Shelter Architecture & Envelope Parameters
  currentY += 70;
  const p = simulationData.design_parameters || {};
  doc.rect(40, currentY, 515, 75).fillAndStroke(colors.lightBg, colors.border);
  doc.fillColor(colors.navy).fontSize(10.5).font('Helvetica-Bold').text('3. SHELTER ARCHITECTURAL & ENVELOPE PARAMETERS', 50, currentY + 8);

  doc.fontSize(8.5).font('Helvetica').fillColor(colors.dark);
  doc.text(`Dimensions (L × W × H): ${p.length || 6} m × ${p.width || 4} m × ${p.height || 2.8} m`, 50, currentY + 25);
  doc.text(`Floor Area: ${((p.length || 6) * (p.width || 4)).toFixed(1)} m² | Volume: ${((p.length || 6) * (p.width || 4) * (p.height || 2.8)).toFixed(1)} m³`, 50, currentY + 39);
  doc.text(`Main Facade Orientation: ${p.orientation || 'South'}`, 50, currentY + 53);

  doc.text(`Fenestration (Window Area): ${p.windowArea || 1.2} m²`, 300, currentY + 25);
  doc.text(`Door Aperture: ${p.doorArea || 1.8} m²`, 300, currentY + 39);
  doc.text(`Occupancy: ${p.occupancy || 6} personnel | Infiltration: ${p.ach || 0.5} ACH`, 300, currentY + 53);

  // Section 4: Materials Specifications
  currentY += 85;
  const m = simulationData.materials_used || {};
  doc.rect(40, currentY, 515, 65).fillAndStroke(colors.lightBg, colors.border);
  doc.fillColor(colors.navy).fontSize(10.5).font('Helvetica-Bold').text('4. ENVELOPE MATERIAL ASSEMBLY SPECIFICATIONS', 50, currentY + 8);

  doc.fontSize(8.5).font('Helvetica').fillColor(colors.dark);
  doc.text(`Wall: ${m.wallStructural ? m.wallStructural.name : 'Structural Timber'} with ${m.wallInsulation ? m.wallInsulation.name : 'Mineral Wool'} (${Math.round((p.wallInsulationThicknessM || 0.10) * 1000)} mm)`, 50, currentY + 24);
  doc.text(`Roof: ${m.roofStructural ? m.roofStructural.name : 'Aluminium Sandwich Panel'} with ${m.roofInsulation ? m.roofInsulation.name : 'Mineral Wool'} (${Math.round((p.roofInsulationThicknessM || 0.10) * 1000)} mm)`, 50, currentY + 38);
  doc.text(`Floor: Insulated Concrete Slab with Sub-grade XPS barrier (50 mm)`, 50, currentY + 50);

  // Section 5: Hourly Simulation Breakdown (Table sample)
  currentY += 75;
  doc.fillColor(colors.navy).fontSize(10.5).font('Helvetica-Bold').text('5. 24-HOUR THERMAL SIMULATION DATA LOG', 40, currentY);

  currentY += 13;
  // Table Header
  doc.rect(40, currentY, 515, 16).fill(colors.navy);
  doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
  doc.text('Hour', 45, currentY + 4);
  doc.text('Outdoor (°C)', 78, currentY + 4);
  doc.text('Solar (W/m²)', 135, currentY + 4);
  doc.text('Indoor (°C)', 198, currentY + 4);
  doc.text('Heat Req (W)', 260, currentY + 4);
  doc.text('Cond Net (W)', 328, currentY + 4);
  doc.text('Infilt Net (W)', 398, currentY + 4);
  doc.text('Comfort Band', 470, currentY + 4);

  currentY += 16;
  const hourly = (simulationData.simulation_results && simulationData.simulation_results.hourly)
    ? simulationData.simulation_results.hourly : [];
  
  const displayHours = hourly.filter((_, idx) => idx % 2 === 0).slice(0, 10);
  doc.font('Helvetica').fontSize(7);

  displayHours.forEach((row, i) => {
    const isOdd = i % 2 === 1;
    if (isOdd) {
      doc.rect(40, currentY, 515, 13).fill('#f1f5f9');
    }
    doc.fillColor(colors.dark);
    doc.text(`${row.time}`, 45, currentY + 3);
    doc.text(`${row.outdoorTemp}`, 78, currentY + 3);
    doc.text(`${row.solarRadiation}`, 135, currentY + 3);
    doc.font('Helvetica-Bold').text(`${row.indoorTemp}`, 198, currentY + 3).font('Helvetica');
    doc.fillColor(row.heatingDemandW > 0 ? '#b91c1c' : colors.dark).text(`${row.heatingDemandW || 0}`, 260, currentY + 3).fillColor(colors.dark);
    doc.text(`${row.conductionGainLoss}`, 328, currentY + 3);
    doc.text(`${row.infiltrationGainLoss}`, 398, currentY + 3);
    
    if (row.isComfortable) {
      doc.fillColor(colors.accentGreen).text('In Band (18-27)', 470, currentY + 3);
    } else {
      doc.fillColor('#dc2626').text('Out of Band', 470, currentY + 3);
    }

    currentY += 13;
  });

  // Footer / Limitations & Official Prototype Disclaimer
  doc.rect(40, 742, 515, 58).fillAndStroke('#fef2f2', '#fecaca');
  doc.fillColor('#991b1b').fontSize(7.5).font('Helvetica-Bold').text('ENGINEERING NOTICE & DISCLAIMER', 48, 748);
  doc.fillColor('#7f1d1d').fontSize(6.5).font('Helvetica').text(
    'This software is a decision-support simulation prototype developed under SIH 2026 (SIH26051). ' +
    'It does not constitute official certification by DRDO or the Ministry of Defence, Government of India. ' +
    'Simulation results are mathematical approximations based on the transient lumped-capacitance method and historical NASA POWER climate observations. ' +
    'Results must be validated against project-specific material test certificates, local micro-topographical factors, structural wind/snow codes, and field measurements before physical construction or operational deployment.',
    48, 758, { width: 498, lineGap: 1.2 }
  );

  doc.end();
}

module.exports = {
  generatePdfReport
};
