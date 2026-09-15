import * as THREE from 'three';

/**
 * Maps a temperature in Celsius to a smooth RGB color scale:
 * Blue (Cold, <= -10°C) -> Cyan (5°C) -> Green/Yellow (18-22°C) -> Orange (28°C) -> Red (>= 35°C)
 */
export function getTemperatureColor(tempC) {
  const t = Math.max(-15, Math.min(38, tempC));
  // Normalized 0 (cold) to 1 (hot)
  const norm = (t - (-15)) / (38 - (-15));

  const color = new THREE.Color();

  if (norm < 0.25) {
    // -15 to -1.75: Blue to Cyan
    const f = norm / 0.25;
    color.setRGB(0.1 + 0.1 * f, 0.3 + 0.5 * f, 0.9);
  } else if (norm < 0.50) {
    // -1.75 to 11.5: Cyan to Green
    const f = (norm - 0.25) / 0.25;
    color.setRGB(0.2 * (1 - f), 0.8, 0.9 * (1 - f) + 0.2 * f);
  } else if (norm < 0.75) {
    // 11.5 to 24.75: Green to Yellow
    const f = (norm - 0.50) / 0.25;
    color.setRGB(0.2 + 0.7 * f, 0.8 + 0.1 * f, 0.1);
  } else {
    // 24.75 to 38: Yellow to Orange/Red
    const f = (norm - 0.75) / 0.25;
    color.setRGB(0.9 + 0.1 * f, 0.9 * (1 - f) + 0.1 * f, 0.1);
  }

  return color;
}
