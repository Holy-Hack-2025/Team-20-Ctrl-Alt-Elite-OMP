// Types for soil data
export type SoilData = {
  nitrogen: number;
  phosphorus: number;
  carbon: number;
  lime: number;
  calcium?: number;
};

// SoilComposition matches the actual data structure
export type SoilComposition = {
  ph_level: number;
  organic_matter_percentage: number;
  nitrogen_level_ppm: number;
  phosphorus_level_ppm: number;
  carbon_level_ppm: number;
  texture: string;
  minerals: {
    calcium_ppm: number;
    magnesium_ppm: number;
    sulfur_ppm: number;
  };
};

// CropData matches actual structure with all mineral requirements
export type CropData = {
  crop_name: string;
  field_size_hectares: number;
  planting_date: string;
  expected_harvest_date: string;
  soil_requirements: {
    ideal_ph: string;
    nitrogen_needs_kg_per_hectare: number;
    phosphorus_needs_kg_per_hectare?: number;
    carbon_needs_kg_per_hectare?: number;
    calcium_needs_kg_per_hectare?: number;
    magnesium_needs_kg_per_hectare?: number;
    sulfur_needs_kg_per_hectare?: number;
    optimal_soil_composition?: {
      nitrogen_ppm: number;
      phosphorus_ppm: number;
      carbon_ppm: number;
      calcium_ppm: number;
      magnesium_ppm: number;
      sulfur_ppm: number;
    };
  };
};

export type FarmerData = {
  id: string;
  name: string;
  farm_name: string;
  location: {
    city: string;
    region: string;
    coordinates?: {
      lat: number;
      long: number;
    };
  };
  total_farm_size_hectares: number;
  soil_data?: SoilData;
  soil_composition?: SoilComposition;
  crops?: CropData[];
};

export type FertilizerComponent = {
  name: string;
  percentage: number;
};

export type Fertilizer = {
  id: number;
  title: string;
  baseAmount: number;
  predictedIncrease: string;
  components: FertilizerComponent[];
  targetCrops: string[];
};

// Types for fertilizer companies
export type FertilizerCompany = {
  id: string;
  name: string;
  location: string;
  customers: FarmerData[];
  waste_allocation_percentage?: number;
  monthly_capacity_kg?: number;
  cost_per_kg_eur?: number;
  max_food_waste_percentage?: number;
};

export type CropRecommendation = {
  cropName: string;
  fieldSize: number;
  fertilizerName: string;
  fertilizerAmount: number;
  nitrogenNeeded: number;
  phosphorusNeeded: number;
  carbonNeeded: number;
  nitrogenDeficiency: number;
  phosphorusDeficiency: number;
  carbonDeficiency: number;
  limeDeficiency?: number;
  limeNeeded?: number;
}; 