export type NutrientContent = {
  nitrogen_kg: number;
  carbon_kg: number;
  phosphorus_kg: number;
  lime_kg: number;
};

// Average nutrient content per kg of food waste by establishment type
export const nutrientContentByEstablishmentType: Record<string, NutrientContent> = {
  "Restaurant": {
    nitrogen_kg: 0.025,
    carbon_kg: 0.45,
    phosphorus_kg: 0.003,
    lime_kg: 0.002
  },
  "Hospital": {
    nitrogen_kg: 0.028,
    carbon_kg: 0.48,
    phosphorus_kg: 0.0035,
    lime_kg: 0.0025
  },
  "School": {
    nitrogen_kg: 0.022,
    carbon_kg: 0.42,
    phosphorus_kg: 0.0028,
    lime_kg: 0.0018
  },
  "Hotel": {
    nitrogen_kg: 0.026,
    carbon_kg: 0.46,
    phosphorus_kg: 0.0032,
    lime_kg: 0.0022
  },
  "default": {
    nitrogen_kg: 0.024,
    carbon_kg: 0.44,
    phosphorus_kg: 0.003,
    lime_kg: 0.002
  }
}; 