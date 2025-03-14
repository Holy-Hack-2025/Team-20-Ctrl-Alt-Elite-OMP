import React, { useEffect, useState } from 'react';
import { FertilizerCompany, Fertilizer } from '../../types/agricultural';
import FertilizerCompanyList from './FertilizerCompanyList';
import FarmerDistribution from './FarmerDistribution';
import foodServiceData from '../../data/food_service_data.json';

type FoodWasteAllocationsProps = {
  fertilizerCompanies: FertilizerCompany[];
  fertilizers: Fertilizer[];
  selectedCompany: string | null;
  setSelectedCompany: (id: string) => void;
};

// Calculate total food waste from the food service data
const calculateTotalFoodWaste = (): number => {
  return foodServiceData.food_service_establishments.reduce((total, establishment) => {
    return total + establishment.locations.reduce((locationTotal, location) => {
      const marchData = location.historical_data["2024"]?.["Q1"]?.["March"];
      return locationTotal + (marchData?.food_waste_kg || 0);
    }, 0);
  }, 0);
};

// Get the predominant establishment type based on waste volume
const getPredominantEstablishmentType = (): string => {
  const typeWasteTotals: Record<string, number> = {};
  
  // Calculate waste totals by establishment type
  foodServiceData.food_service_establishments.forEach(establishment => {
    const establishmentType = establishment.type;
    
    if (!typeWasteTotals[establishmentType]) {
      typeWasteTotals[establishmentType] = 0;
    }
    
    establishment.locations.forEach(location => {
      const marchData = location.historical_data["2024"]?.["Q1"]?.["March"];
      typeWasteTotals[establishmentType] += (marchData?.food_waste_kg || 0);
    });
  });
  
  // Find the type with the most waste
  let predominantType = "default";
  let maxWaste = 0;
  
  Object.entries(typeWasteTotals).forEach(([type, waste]) => {
    if (waste > maxWaste) {
      maxWaste = waste;
      predominantType = type;
    }
  });
  
  // Map establishment types to our nutrient content types
  const typeMapping: Record<string, string> = {
    "Fast Food Chain": "Restaurant",
    "Restaurant": "Restaurant",
    "Chain Restaurant": "Restaurant",
    "Hospital": "Hospital",
    "School Cafeteria Network": "School",
    "University Food Service": "School",
    "Corporate Cafeteria": "default",
    "Event Venue": "Hotel",
    "Correctional Facility": "default"
  };
  
  return typeMapping[predominantType] || "default";
};

const FoodWasteAllocations: React.FC<FoodWasteAllocationsProps> = ({
  fertilizerCompanies,
  fertilizers,
  selectedCompany,
  setSelectedCompany
}) => {
  // Calculate total food waste
  const [totalFoodWaste, setTotalFoodWaste] = useState<number>(0);
  const [predominantType, setPredominantType] = useState<string>("default");
  
  useEffect(() => {
    // Calculate total food waste from food service data
    const calculatedWaste = calculateTotalFoodWaste();
    setTotalFoodWaste(calculatedWaste);
    
    // Determine predominant establishment type
    const calculatedType = getPredominantEstablishmentType();
    setPredominantType(calculatedType);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm mb-6">
      <div className="p-5 border-b border-gray-100">
        <h2 className="text-lg font-medium text-gray-800">Food Waste Allocations</h2>
        <p className="text-sm text-gray-600 mt-1">
          Distribution of {totalFoodWaste.toLocaleString()} kg of food waste to fertilizer companies
        </p>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fertilizer Companies Overview */}
          <FertilizerCompanyList
            fertilizerCompanies={fertilizerCompanies}
            selectedCompany={selectedCompany}
            setSelectedCompany={setSelectedCompany}
            fertilizers={fertilizers}
            totalFoodWasteKg={totalFoodWaste}
            defaultEstablishmentType={predominantType}
          />

          {/* Farmer Details */}
          <FarmerDistribution
            selectedCompany={selectedCompany}
            fertilizerCompanies={fertilizerCompanies}
            fertilizers={fertilizers}
          />
        </div>
      </div>
    </div>
  );
};

export default FoodWasteAllocations; 