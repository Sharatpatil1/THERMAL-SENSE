const Joi = require('joi');

const liveWeatherQuerySchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required()
});

const weatherQuerySchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required().messages({
    'number.base': 'Latitude must be a valid number.',
    'number.min': 'Latitude cannot be less than -90 degrees.',
    'number.max': 'Latitude cannot exceed 90 degrees.',
    'any.required': 'Latitude is required.'
  }),

  longitude: Joi.number().min(-180).max(180).required().messages({
    'number.base': 'Longitude must be a valid number.',
    'number.min': 'Longitude cannot be less than -180 degrees.',
    'number.max': 'Longitude cannot exceed 180 degrees.',
    'any.required': 'Longitude is required.'
  }),

  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      'string.pattern.base':
        'Date must be formatted as YYYY-MM-DD (e.g., 2025-01-15).',
      'any.required': 'Date is required.'
    })
});

const shelterSchema = Joi.object({
  length: Joi.number()
    .positive()
    .min(1)
    .max(50)
    .required()
    .messages({
      'number.positive': 'Shelter length must be greater than zero.',
      'number.min': 'Shelter length must be at least 1.0 meter.'
    }),

  width: Joi.number()
    .positive()
    .min(1)
    .max(50)
    .required()
    .messages({
      'number.positive': 'Shelter width must be greater than zero.',
      'number.min': 'Shelter width must be at least 1.0 meter.'
    }),

  height: Joi.number()
    .positive()
    .min(1.8)
    .max(10)
    .required()
    .messages({
      'number.positive': 'Shelter height must be greater than zero.',
      'number.min': 'Shelter height must be at least 1.8 meters.'
    }),

  orientation: Joi.string()
    .valid('North', 'South', 'East', 'West')
    .default('South'),

  windowArea: Joi.number()
    .min(0)
    .max(100)
    .default(1.2),

  doorArea: Joi.number()
    .min(0)
    .max(20)
    .default(1.8),

  occupancy: Joi.number()
    .integer()
    .min(0)
    .max(100)
    .default(6),

  ach: Joi.number()
    .min(0.05)
    .max(10)
    .default(0.5),

  equipmentHeatLoadW: Joi.number()
    .min(0)
    .default(150),

  lightingHeatLoadW: Joi.number()
    .min(0)
    .default(60),

  wallThicknessM: Joi.number()
    .min(0.05)
    .max(1.0)
    .default(0.20),

  wallInsulationThicknessM: Joi.number()
    .min(0)
    .max(0.5)
    .default(0.10),

  roofThicknessM: Joi.number()
    .min(0.05)
    .max(1.0)
    .default(0.15),

  roofInsulationThicknessM: Joi.number()
    .min(0)
    .max(0.5)
    .default(0.10),

  floorThicknessM: Joi.number()
    .min(0.05)
    .max(1.0)
    .default(0.15),

  floorInsulationThicknessM: Joi.number()
    .min(0)
    .max(0.5)
    .default(0.05),

  initialIndoorTemp: Joi.number().optional(),

  comfortMin: Joi.number()
    .default(18),

  comfortMax: Joi.number()
    .default(27)
}).custom((value, helpers) => {
  const grossWallArea =
    2 * (value.length + value.width) * value.height;

  const totalOpenings =
    (value.windowArea || 0) +
    (value.doorArea || 0);

  if (totalOpenings >= grossWallArea * 0.85) {
    return helpers.message(
      `Total opening area (${totalOpenings.toFixed(
        1
      )} m²) cannot exceed 85% of gross wall area (${grossWallArea.toFixed(
        1
      )} m²).`
    );
  }

  if (
    value.comfortMin !== undefined &&
    value.comfortMax !== undefined &&
    value.comfortMin >= value.comfortMax
  ) {
    return helpers.message(
      `Comfort minimum temperature (${value.comfortMin}°C) must be less than maximum (${value.comfortMax}°C).`
    );
  }

  return value;
});

/*
 * Thermal Simulation Request Schema
 *
 * weatherHourly contains exactly 24 hourly weather records.
 *
 * Live weather records may contain:
 * - hour
 * - time
 * - timestamp
 * - temperature
 * - humidity
 * - windSpeed
 * - solarRadiation
 * - solarRadiationSource
 */
const simulateRequestSchema = Joi.object({
  shelter: shelterSchema.required(),

  materials: Joi.object().optional(),

  weatherHourly: Joi.array()
    .items(
      Joi.object({
        hour: Joi.number().required(),

        time: Joi.string().required(),

        // ISO timestamp supplied by live weather service
        timestamp: Joi.string()
          .isoDate()
          .optional(),

        temperature: Joi.number().required(),

        humidity: Joi.number().required(),

        windSpeed: Joi.number().required(),

        solarRadiation: Joi.number().required(),

        // Example: "model" / "satellite"
        solarRadiationSource: Joi.string().optional()
      })
    )
    .length(24)
    .required()
    .messages({
      'array.length':
        'Weather dataset must contain exactly 24 hourly records.'
    })
});

module.exports = {
  weatherQuerySchema,
  liveWeatherQuerySchema,
  shelterSchema,
  simulateRequestSchema
};