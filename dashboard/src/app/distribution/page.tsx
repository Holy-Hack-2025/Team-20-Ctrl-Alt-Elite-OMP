'use client';

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import FertilizerCard from "@/components/FertilizerCard";
import WasteStatusCard from "@/components/WasteStatusCard";
import foodServiceData from "../../data/food_service_data.json";
import agriculturalData from '../../data/agricultural_data.json';
import fertilizerData from '../../data/fertilizer_data.json';
import FoodServiceStats from '@/components/distribution/FoodServiceStats';
import FoodWasteAllocations from '@/components/distribution/FoodWasteAllocations';
import { FertilizerComponent, Fertilizer, FertilizerCompany } from '@/types/agricultural';

// Define these types locally since they conflict with the imports
type HistoricalData = {
  revenue: number;
  food_waste_kg: number;
  waste_factor: number;
};

type Location = {
  id: string;
  name: string;
  address: string;
  capacity?: string;
  meals_per_day?: number;
  historical_data: {
    [year: string]: {
      [quarter: string]: {
        [month: string]: HistoricalData;
      };
    };
  };
  running_average_waste_factor: number;
  projected_data: {
    [year: string]: {
      [quarter: string]: {
        [month: string]: {
          projected_revenue: number;
          estimated_waste_kg: number;
        };
      };
    };
  };
  locations_included?: Array<{
    name: string;
    address: string;
    daily_meals: number;
  }>;
};

type Establishment = {
  id: string;
  name: string;
  type: string;
  locations: Location[];
};

type FoodServiceData = {
  food_service_establishments: Establishment[];
};

// Add new types for soil data
interface SoilData {
  nitrogen: number;
  phosphorus: number;
  carbon: number;
  lime: number;
}

// Update SoilComposition to match the actual data structure
interface SoilComposition {
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
}

// Update CropData to match actual structure with all mineral requirements
type CropData = {
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

type FarmerData = {
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

interface SoilRequirements {
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
}

export default function DistributionDashboard() {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [expandedLocations, setExpandedLocations] = useState<{ [key: string]: boolean }>({});

  // Add state for waste allocation view
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  // Get fertilizer data
  const fertilizers: Fertilizer[] = fertilizerData.fertilizers;

  // Get fertilizer companies data
  const fertilizer_companies: FertilizerCompany[] = agriculturalData.fertilizer_companies.map(company => ({
    ...company,
    // Add default waste allocation and capacity based on number of customers
    waste_allocation_percentage: 100 / agriculturalData.fertilizer_companies.length,
    monthly_capacity_kg: company.customers.length * 5000 // Assuming 5000kg per customer as base capacity
  }));

  // Toggle location visibility
  const toggleLocations = (sourceId: string) => {
    setExpandedLocations(prev => ({
      ...prev,
      [sourceId]: !prev[sourceId]
    }));
  };

  // Get unique establishment types
  const establishmentTypes = ["all", ...new Set(foodServiceData.food_service_establishments.flatMap(
    establishment => establishment.locations.map(location => establishment.type)
  ))];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <main className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Food Waste Sources Dashboard</h1>
              <p className="text-gray-600 mt-1">Monitoring and analyzing food waste from various establishments</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-600">Filter by Type:</span>
              <select 
                className="bg-white border border-gray-200 rounded-md text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                {establishmentTypes.map(type => (
                  <option key={type} value={type}>
                    {type === "all" ? "All Types" : type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Food Service Stats Component */}
          <FoodServiceStats 
            foodServiceData={foodServiceData}
            selectedType={selectedType}
            expandedLocations={expandedLocations}
            toggleLocations={toggleLocations}
          />

          {/* Food Waste Allocations Component */}
          <FoodWasteAllocations 
            fertilizerCompanies={fertilizer_companies}
            fertilizers={fertilizers}
            selectedCompany={selectedCompany}
            setSelectedCompany={setSelectedCompany}
          />
        </main>
      </div>
    </div>
  );
} 