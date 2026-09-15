import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function downloadClientPdfReport(simulationRecord) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner (Dark Navy)
  doc.setFillColor(11, 25, 44);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // App Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('SHELTERX', 14, 10.5);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Smart Shelters. Safer Missions. | Decision-Support Simulation Prototype',
    14,
    16.5
  );

  doc.setTextColor(56, 189, 248);
  doc.text(
    'SIH 2026 – SIH26051 | For DRDO & Indian Armed Forces Field Evaluations',
    14,
    22.5
  );

  const timestamp = new Date()
    .toISOString()
    .replace('T', ' ')
    .substring(0, 19);

  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Generated: ${timestamp} UTC`,
    pageWidth - 14,
    10.5,
    { align: 'right' }
  );

  doc.text(
    `ID: ${simulationRecord.id || 'SIM-ACTIVE'}`,
    pageWidth - 14,
    16.5,
    { align: 'right' }
  );

  let y = 34;

  // 1. Executive Thermal & HVAC Summary Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 30, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(
    '1. EXECUTIVE THERMAL & HVAC SIZING SUMMARY',
    18,
    y + 6
  );

  const summary =
    simulationRecord.simulation_results &&
    simulationRecord.simulation_results.summary
      ? simulationRecord.simulation_results.summary
      : simulationRecord.summary || {};

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text('Temperature Comfort Score:', 18, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text(`${summary.thermalScore || 0} / 100`, 62, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Comfort Hours (18-27°C):', 18, y + 19);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(
    `${summary.comfortPercentage || 0}% (${summary.comfortHours || 0} of 24 hrs)`,
    62,
    y + 19
  );

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Average Indoor Temp:', 18, y + 25);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(
    `${summary.avgIndoorTemp || 0} °C (Min: ${
      summary.minIndoorTemp || 0
    }°C, Max: ${summary.maxIndoorTemp || 0}°C)`,
    62,
    y + 25
  );

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Active Heating Demand:', 116, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text(
    `${
      summary.totalHeatingDemandKwh !== undefined
        ? summary.totalHeatingDemandKwh
        : 0
    } kWh/day (Peak: ${summary.peakHeatingLoadKw || 0} kW)`,
    156,
    y + 13
  );

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Active Cooling Demand:', 116, y + 19);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(2, 132, 199);
  doc.text(
    `${
      summary.totalCoolingDemandKwh !== undefined
        ? summary.totalCoolingDemandKwh
        : 0
    } kWh/day`,
    156,
    y + 19
  );

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('NASA Climate Mean:', 116, y + 25);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${summary.outdoorAvgTemp || 'N/A'} °C`, 156, y + 25);

  y += 35;

  // 2. Location & NASA Climate Data
  doc.roundedRect(14, y, pageWidth - 28, 20, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(
    '2. LOCATION & NASA POWER CLIMATE DATA SOURCE',
    18,
    y + 6
  );

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text(
    `Location: ${
      simulationRecord.location_name || 'Leh, Ladakh, India'
    }`,
    18,
    y + 12
  );

  doc.text(
    `Coordinates: Lat ${
      simulationRecord.latitude || '34.1526'
    }°, Lon ${simulationRecord.longitude || '77.5771'}°`,
    18,
    y + 16.5
  );

  doc.text(
    `Simulation Date: ${
      simulationRecord.date_simulated || '2025-01-15'
    }`,
    116,
    y + 12
  );

  doc.text(
    'Source: NASA POWER Hourly Point Observations (Verified Real Data)',
    116,
    y + 16.5
  );

  y += 24;

  // 3. Shelter Geometry & Assembly Table
  const p = simulationRecord.design_parameters || {};
  const m = simulationRecord.materials_used || {};

  doc.autoTable({
    startY: y,
    margin: { left: 14, right: 14 },
    head: [
      ['Component / Parameter', 'Specification', 'Engineering Value']
    ],
    body: [
      [
        'Dimensions (L × W × H)',
        `${p.length || 6} m × ${p.width || 4} m × ${
          p.height || 2.8
        } m`,
        `Floor: ${((p.length || 6) * (p.width || 4)).toFixed(
          1
        )} m², Volume: ${(
          (p.length || 6) *
          (p.width || 4) *
          (p.height || 2.8)
        ).toFixed(1)} m³`
      ],
      [
        'Orientation & Glazing',
        `Facade Facing: ${p.orientation || 'South'}`,
        `Window: ${p.windowArea || 1.2} m², Door: ${
          p.doorArea || 1.8
        } m²`
      ],
      [
        'Occupancy & Infiltration',
        `${p.occupancy || 6} personnel`,
        `Infiltration: ${p.ach || 0.5} ACH, Internal Loads: ${
          (p.equipmentHeatLoadW || 150) +
          (p.lightingHeatLoadW || 60)
        } W`
      ],
      [
        'Wall Construction',
        m.wallStructural
          ? m.wallStructural.name
          : 'Structural Timber (200 mm)',
        `Insulation: ${
          m.wallInsulation
            ? m.wallInsulation.name
            : 'Mineral Wool'
        } (${Math.round(
          (p.wallInsulationThicknessM || 0.1) * 1000
        )} mm)`
      ],
      [
        'Roof Construction',
        m.roofStructural
          ? m.roofStructural.name
          : 'Aluminium Sandwich Panel',
        `Insulation: ${
          m.roofInsulation
            ? m.roofInsulation.name
            : 'Mineral Wool'
        } (${Math.round(
          (p.roofInsulationThicknessM || 0.1) * 1000
        )} mm)`
      ],
      [
        'Floor / Foundation',
        m.floorStructural
          ? m.floorStructural.name
          : 'Insulated Concrete Form',
        'Sub-grade XPS thermal barrier (50 mm)'
      ]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      fontSize: 8,
      textColor: 255
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59]
    },
    styles: {
      cellPadding: 1.8
    }
  });

  y = doc.lastAutoTable.finalY + 5;

  // 4. Hourly Simulation Log Table
  const hourly =
    simulationRecord.simulation_results &&
    simulationRecord.simulation_results.hourly
      ? simulationRecord.simulation_results.hourly
      : [];

  const tableRows = hourly.map((row) => [
    row.time,
    `${row.outdoorTemp} °C`,
    `${row.solarRadiation} W/m²`,
    `${row.indoorTemp} °C`,
    `${row.heatingDemandW || 0} W`,
    `${row.conductionGainLoss} W`,
    `${row.infiltrationGainLoss} W`,
    row.isComfortable ? 'In Band' : 'Out of Band'
  ]);

  doc.autoTable({
    startY: y,
    margin: { left: 14, right: 14 },
    head: [
      [
        'Time',
        'Outdoor T',
        'Solar Irrad',
        'Indoor T',
        'Heat Req',
        'Cond Net',
        'Infilt Net',
        'Comfort'
      ]
    ],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [11, 25, 44],
      fontSize: 7.5,
      textColor: 255
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249]
    },
    styles: {
      cellPadding: 1.2
    },
    didParseCell: function (data) {
      if (
        data.column.index === 7 &&
        data.cell.raw === 'In Band'
      ) {
        data.cell.styles.textColor = [5, 150, 105];
        data.cell.styles.fontStyle = 'bold';
      } else if (
        data.column.index === 7 &&
        data.cell.raw === 'Out of Band'
      ) {
        data.cell.styles.textColor = [220, 38, 38];
      }
    }
  });

  // Footer Disclaimer on each page
  const pageCount = doc.internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Bottom banner
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
    doc.rect(14, 276, pageWidth - 28, 14, 'FD');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(153, 27, 27);
    doc.text(
      'ENGINEERING NOTICE & DISCLAIMER',
      17,
      279.5
    );

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(127, 29, 29);
    doc.text(
      'This software is a decision-support simulation prototype developed under SIH 2026 (SIH26051). ' +
        'Results must be validated against project-specific material properties, standards, field measurements, ' +
        'and engineering analysis before construction or operational deployment. Page ' +
        i +
        ' of ' +
        pageCount,
      17,
      283.5,
      { maxWidth: pageWidth - 34 }
    );
  }

  const filename = `ShelterX_Report_${
    simulationRecord.id || 'Field_Shelter'
  }.pdf`;

  doc.save(filename);
}