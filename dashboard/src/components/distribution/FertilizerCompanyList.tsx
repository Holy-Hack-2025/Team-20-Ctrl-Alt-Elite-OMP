import React, { useEffect, useState } from 'react';
import { FertilizerCompany, CropRecommendation, Fertilizer } from '../../types/agricultural';
import { getBestFertilizerForCrop, getSoilData, createCropRecommendation } from '../../utils/fertilizerUtils';
import { NutrientContent, nutrientContentByEstablishmentType } from '../../data/foodWasteMinerals';

type FertilizerCompanyListProps = {
  fertilizerCompanies: FertilizerCompany[];
  selectedCompany: string | null;
  setSelectedCompany: (id: string) => void;
  fertilizers: Fertilizer[];
  totalFoodWasteKg?: number; // Total available food waste in kg
};

// New type for storing waste allocation data
type WasteAllocation = {
  companyId: string;
  companyName: string;
  allocation_kg: number;
  revenue_eur: number;
  cost_per_kg_eur: number;
  max_food_waste_percentage: number;
  nutrients?: {
    nitrogen_kg: number;
    phosphorus_kg: number;
    carbon_kg: number;
    lime_kg: number;
  };
};

// Type for storing fertilizer recommendations
type FertilizerRecommendations = {
  companyId: string;
  farmerRecommendations: {
    farmerId: string;
    cropRecommendations: CropRecommendation[];
  }[];
};

// Type for storing fertilizer summaries
type FertilizerSummary = {
  companyId: string;
  companyName: string;
  fertilizerTotals: {
    [fertilizerName: string]: number;  // Total amount needed for each fertilizer type
  };
  totalAmount: number;  // Total amount of all fertilizers
};

// Type for nutrient totals
type NutrientTotals = {
  [nutrientName: string]: number;
};

// Type for the exported fertilizer data
export type FertilizerExportData = {
  headers: string[];
  companies: {
    name: string;
    fertilizerAmounts: number[];
    total: number;
  }[];
  totals: {
    fertilizerAmounts: number[];
    grandTotal: number;
  };
};

// Function to calculate optimal waste allocation to maximize profit
export const calculateOptimalWasteAllocation = (
  companies: FertilizerCompany[], 
  totalFoodWasteKg: number = 10000, // Default to 10 tons if not specified
  establishmentType: string = "default" // Default establishment type for nutrient content
): WasteAllocation[] => {
  // Sort companies by price they're willing to pay, highest first
  const sortedCompanies = [...companies].sort((a, b) => 
    (b.cost_per_kg_eur || 0) - (a.cost_per_kg_eur || 0)
  );
  
  let remainingWaste = totalFoodWasteKg;
  const allocations: WasteAllocation[] = [];
  
  // Get nutrient content for this type of establishment
  const nutrientContent = nutrientContentByEstablishmentType[establishmentType] || 
                          nutrientContentByEstablishmentType["default"];

  // First pass: assign to highest-paying companies first
  for (const company of sortedCompanies) {
    if (remainingWaste <= 0) break;
    
    // Calculate fertilizer needs more accurately based on customer data
    const fertilizerNeeds = company.customers.reduce((sum, farmer) => {
      // If detailed crop data is available, use it for more precise calculation
      if (farmer.crops && farmer.crops.length > 0) {
        return sum + farmer.crops.reduce((cropSum, crop) => {
          // Base fertilizer on crop's nitrogen needs from soil requirements, with default of 200kg/hectare if not specified
          const fertilizerPerHectare = crop.soil_requirements.nitrogen_needs_kg_per_hectare || 200;
          return cropSum + (fertilizerPerHectare * crop.field_size_hectares);
        }, 0);
      } else {
        // Fallback to estimate based on total farm size if no crop data
        return sum + farmer.total_farm_size_hectares * 250;
      }
    }, 0);
    
    // Calculate maximum waste based on percentage (with fallback to 0 if undefined)
    const maxWastePercentage = company.max_food_waste_percentage ?? 0;
    const maxWaste = fertilizerNeeds * (maxWastePercentage / 100);
    
    // Allocate minimum of what's available and what company can accept
    const allocation = Math.min(remainingWaste, maxWaste);
    
    // Calculate the nutrient content in this allocation
    const nutrientsInAllocation = {
      nitrogen_kg: allocation * nutrientContent.nitrogen_kg,
      phosphorus_kg: allocation * nutrientContent.phosphorus_kg,
      carbon_kg: allocation * nutrientContent.carbon_kg,
      lime_kg: allocation * nutrientContent.lime_kg
    };
    
    allocations.push({
      companyId: company.id,
      companyName: company.name,
      allocation_kg: allocation,
      revenue_eur: allocation * (company.cost_per_kg_eur || 0),
      cost_per_kg_eur: company.cost_per_kg_eur || 0,
      max_food_waste_percentage: company.max_food_waste_percentage || 0,
      nutrients: nutrientsInAllocation
    });
    
    remainingWaste -= allocation;
  }
  
  // Calculate allocation percentages based on total available food waste, not just what was allocated
  // This ensures percentages reflect actual portion of total available waste, not just allocated waste
  for (const company of companies) {
    const allocation = allocations.find(a => a.companyId === company.id);
    company.waste_allocation_percentage = allocation 
      ? Math.round((allocation.allocation_kg / totalFoodWasteKg) * 100) 
      : 0;
  }
  
  return allocations;
};

// Utility function to generate fertilizer data
export const generateFertilizerExportData = (summaries: FertilizerSummary[]): FertilizerExportData => {
  // Get all unique fertilizer types
  const allFertilizerTypes = new Set<string>();
  summaries.forEach(company => {
    Object.keys(company.fertilizerTotals).forEach(fertilizerType => {
      allFertilizerTypes.add(fertilizerType);
    });
  });
  const fertilizerTypes = Array.from(allFertilizerTypes).sort();

  // Generate headers
  const headers = ['Company Name', ...fertilizerTypes.map(type => `${type} (kg)`), 'Total (kg)'];

  // Generate company data
  const companies = summaries.map(company => ({
    name: company.companyName,
    fertilizerAmounts: fertilizerTypes.map(type => company.fertilizerTotals[type] || 0),
    total: company.totalAmount
  }));

  // Calculate totals
  const fertilizerTotals = fertilizerTypes.map(type =>
    summaries.reduce((sum, company) => sum + (company.fertilizerTotals[type] || 0), 0)
  );
  const grandTotal = summaries.reduce((sum, company) => sum + company.totalAmount, 0);

  return {
    headers,
    companies,
    totals: {
      fertilizerAmounts: fertilizerTotals,
      grandTotal
    }
  };
};

// Function to convert export data to CSV
export const convertFertilizerDataToCsv = (data: FertilizerExportData): string => {
  let csvContent = data.headers.join(',') + '\n';

  // Add company rows
  data.companies.forEach(company => {
    csvContent += `${company.name},${company.fertilizerAmounts.join(',')},${company.total}\n`;
  });

  // Add totals row
  csvContent += `Total,${data.totals.fertilizerAmounts.join(',')},${data.totals.grandTotal}\n`;

  return csvContent;
};

// Utility function to calculate nutrient requirements
const calculateNutrientRequirements = (
  fertilizerTotals: { [key: string]: number },
  fertilizers: Fertilizer[]
): NutrientTotals => {
  const nutrientTotals: NutrientTotals = {};

  Object.entries(fertilizerTotals).forEach(([fertilizerName, amount]) => {
    const fertilizer = fertilizers.find(f => f.title === fertilizerName);
    if (fertilizer) {
      fertilizer.components.forEach(component => {
        const nutrientAmount = (amount * component.percentage) / 100;
        if (!nutrientTotals[component.name]) {
          nutrientTotals[component.name] = 0;
        }
        nutrientTotals[component.name] += nutrientAmount;
      });
    }
  });

  return nutrientTotals;
};

const FertilizerCompanyList: React.FC<FertilizerCompanyListProps> = ({
  fertilizerCompanies,
  selectedCompany,
  setSelectedCompany,
  fertilizers,
  totalFoodWasteKg = 10000, // Default to 10 tons if not specified
}) => {
  // State to store fertilizer recommendations
  const [recommendations, setRecommendations] = useState<FertilizerRecommendations[]>([]);
  // State to store fertilizer summaries
  const [summaries, setSummaries] = useState<FertilizerSummary[]>([]);
  // State to store waste allocations
  const [wasteAllocations, setWasteAllocations] = useState<WasteAllocation[]>([]);
  // State to store total revenue
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  // Add state for establishment type
  const [establishmentType, setEstablishmentType] = useState<string>("default");

  // Calculate allocations when component mounts or companies/total waste changes
  useEffect(() => {
    const allocations = calculateOptimalWasteAllocation(
      fertilizerCompanies, 
      totalFoodWasteKg,
      establishmentType
    );
    setWasteAllocations(allocations);
    
    // Calculate total revenue
    const revenue = allocations.reduce((sum, alloc) => sum + alloc.revenue_eur, 0);
    setTotalRevenue(revenue);
  }, [fertilizerCompanies, totalFoodWasteKg, establishmentType]);

  // Calculate recommendations when companies change
  useEffect(() => {
    const allRecommendations = fertilizerCompanies.map(company => {
      const farmerRecommendations = company.customers.map(farmer => {
        const soilData = getSoilData(farmer);
        
        // Get recommendations for each crop
        const cropRecommendations = farmer.crops
          ? farmer.crops.map(crop => {
              const bestFertilizer = getBestFertilizerForCrop(crop, soilData, fertilizers);
              if (!bestFertilizer) return null;
              
              return createCropRecommendation(crop, soilData, bestFertilizer);
            })
          .filter((rec): rec is CropRecommendation => rec !== null)
          : [];

        return {
          farmerId: farmer.id,
          cropRecommendations
        };
      });

      return {
        companyId: company.id,
        farmerRecommendations
      };
    });

    setRecommendations(allRecommendations);

    // Calculate summaries from recommendations
    const newSummaries = allRecommendations.map(companyRec => {
      const company = fertilizerCompanies.find(c => c.id === companyRec.companyId)!;
      const fertilizerTotals: { [key: string]: number } = {};
      let totalAmount = 0;

      // Sum up all fertilizer amounts for this company
      companyRec.farmerRecommendations.forEach(farmer => {
        farmer.cropRecommendations.forEach(crop => {
          // Ensure we have valid numbers for calculation
          const amount = Number(crop.fertilizerAmount) || 0;
          const size = Number(crop.fieldSize) || 0;
          const calculatedAmount = amount * size;
          
          // Ensure the fertilizer name exists and initialize if needed
          if (!fertilizerTotals[crop.fertilizerName]) {
            fertilizerTotals[crop.fertilizerName] = 0;
          }
          
          // Only add valid numbers to the totals
          if (!isNaN(calculatedAmount)) {
            fertilizerTotals[crop.fertilizerName] += calculatedAmount;
            totalAmount += calculatedAmount;
          }
        });
      });

      // Clean up any NaN values in the totals
      Object.keys(fertilizerTotals).forEach(key => {
        if (isNaN(fertilizerTotals[key])) {
          fertilizerTotals[key] = 0;
        }
      });

      // Ensure total amount is valid
      totalAmount = isNaN(totalAmount) ? 0 : totalAmount;

      return {
        companyId: company.id,
        companyName: company.name,
        fertilizerTotals,
        totalAmount
      };
    });

    setSummaries(newSummaries);
  }, [fertilizerCompanies, fertilizers]);

  // Updated export function to use the new utility functions
  const exportFertilizerData = () => {
    const exportData = generateFertilizerExportData(summaries);
    const csvContent = convertFertilizerDataToCsv(exportData);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'fertilizer_requirements.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export waste allocation data to CSV
  const exportWasteAllocationData = () => {
    const headers = ['Company Name', 'Allocation (kg)', 'Allocation (%)', 'Revenue (EUR)', 'Cost per kg (EUR)', 'Max Waste %'];
    let csvContent = headers.join(',') + '\n';

    // Add company rows
    wasteAllocations.forEach(allocation => {
      const allocationPercentage = ((allocation.allocation_kg / totalFoodWasteKg) * 100).toFixed(1);
      csvContent += `${allocation.companyName},${allocation.allocation_kg.toFixed(2)},${allocationPercentage}%,${allocation.revenue_eur.toFixed(2)},${allocation.cost_per_kg_eur.toFixed(2)},${allocation.max_food_waste_percentage}\n`;
    });

    // Add total row
    const totalAllocation = wasteAllocations.reduce((sum, alloc) => sum + alloc.allocation_kg, 0);
    const totalAllocationPercentage = ((totalAllocation / totalFoodWasteKg) * 100).toFixed(1);
    csvContent += `Total,${totalAllocation.toFixed(2)},${totalAllocationPercentage}%,${totalRevenue.toFixed(2)},,\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'waste_allocation.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Add establishment type selector
  const handleEstablishmentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEstablishmentType(e.target.value);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-gray-900">Fertilizer Companies</h3>
        <div className="space-x-2">
          <button
            onClick={exportFertilizerData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
          >
            Export Requirements
          </button>
          <button
            onClick={exportWasteAllocationData}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200"
          >
            Export Allocations
          </button>
        </div>
      </div>
      
      {/* Add establishment type selector */}
      <div className="mb-4">
        <label htmlFor="establishmentType" className="block text-sm font-medium text-gray-700 mb-1">
          Food Waste Source Type
        </label>
        <select
          id="establishmentType"
          value={establishmentType}
          onChange={handleEstablishmentTypeChange}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="default">Default</option>
          <option value="Restaurant">Restaurant</option>
          <option value="Hospital">Hospital</option>
          <option value="School">School</option>
          <option value="Hotel">Hotel</option>
        </select>
      </div>
      
      {/* Display total waste and revenue information */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-600">Total Food Waste</h4>
            <p className="text-xl font-bold text-blue-700">{totalFoodWasteKg.toLocaleString()} kg</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-600">Total Revenue</h4>
            <p className="text-xl font-bold text-green-700">€{totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>
        </div>
        
        {/* Add allocation summary */}
        {wasteAllocations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-600">Total Allocated</h4>
                {(() => {
                  const totalAllocated = wasteAllocations.reduce((sum, alloc) => sum + alloc.allocation_kg, 0);
                  const allocatedPercentage = Math.round((totalAllocated / totalFoodWasteKg) * 100);
                  return (
                    <p className="text-md font-bold text-blue-700">
                      {totalAllocated.toLocaleString()} kg ({allocatedPercentage}%)
                    </p>
                  );
                })()}
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-600">Unallocated Waste</h4>
                {(() => {
                  const totalAllocated = wasteAllocations.reduce((sum, alloc) => sum + alloc.allocation_kg, 0);
                  const unallocated = totalFoodWasteKg - totalAllocated;
                  const unallocatedPercentage = Math.round((unallocated / totalFoodWasteKg) * 100);
                  return (
                    <p className="text-md font-bold text-orange-600">
                      {unallocated.toLocaleString()} kg ({unallocatedPercentage}%)
                    </p>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        {fertilizerCompanies.map((company: FertilizerCompany) => {
          const companySummary = summaries.find(s => s.companyId === company.id);
          const wasteAllocation = wasteAllocations.find(w => w.companyId === company.id);
          
          return (
            <div
              key={company.id}
              className={`p-4 rounded-lg transition-colors duration-200 cursor-pointer ${
                selectedCompany === company.id
                  ? 'bg-blue-50 border-2 border-blue-200'
                  : 'bg-white border border-gray-200 hover:border-blue-200'
              }`}
              onClick={() => setSelectedCompany(company.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{company.name}</h4>
                  <p className="text-sm text-gray-600">{company.location}</p>
                  <div className="text-xs text-gray-500 mt-1 flex items-center">
                    <span className="mr-3">Cost: €{company.cost_per_kg_eur?.toFixed(2)}/kg</span>
                    <span>Max Waste: {company.max_food_waste_percentage}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-blue-600">
                    {company.waste_allocation_percentage}% of Total Waste
                  </span>
                  {wasteAllocation && (
                    <div className="mt-1">
                      <p className="text-xs text-gray-600">{wasteAllocation.allocation_kg.toLocaleString()} kg allocated</p>
                      <p className="text-xs font-medium text-green-600">
                        €{wasteAllocation.revenue_eur.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} revenue
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Display fertilizer totals */}
              {companySummary && (
                <div className="mt-3 p-2 bg-gray-50 rounded">
                  <p className="text-sm font-medium text-gray-700 mb-2">Required Fertilizers:</p>
                  <div className="space-y-1">
                    {Object.entries(companySummary.fertilizerTotals).map(([name, amount]) => (
                      <div key={name} className="flex justify-between text-sm">
                        <span className="text-gray-600">{name}:</span>
                        <span className="font-medium text-gray-900">{amount.toLocaleString()} kg</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-medium pt-1 border-t border-gray-200">
                      <span className="text-gray-700">Total:</span>
                      <span className="text-blue-600">{companySummary.totalAmount.toLocaleString()} kg</span>
                    </div>

                    {/* Add Nutrient Requirements Section */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Nutrient Requirements:</p>
                      {Object.entries(calculateNutrientRequirements(companySummary.fertilizerTotals, fertilizers)).map(
                        ([nutrient, amount]) => (
                          <div key={nutrient} className="flex justify-between text-sm">
                            <span className="text-gray-600">{nutrient}:</span>
                            <span className="font-medium text-gray-900">{amount.toLocaleString()} kg</span>
                          </div>
                        )
                      )}
                    </div>
                    
                    {/* Display nutrients in allocation if available */}
                    {wasteAllocation && wasteAllocation.nutrients && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-2">Nutrients in Allocated Waste:</p>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Nitrogen:</span>
                          <span className="font-medium text-gray-900">{wasteAllocation.nutrients.nitrogen_kg.toFixed(2)} kg</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Phosphorus:</span>
                          <span className="font-medium text-gray-900">{wasteAllocation.nutrients.phosphorus_kg.toFixed(2)} kg</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Carbon:</span>
                          <span className="font-medium text-gray-900">{wasteAllocation.nutrients.carbon_kg.toFixed(2)} kg</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Lime:</span>
                          <span className="font-medium text-gray-900">{wasteAllocation.nutrients.lime_kg.toFixed(2)} kg</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Farmers Served:</span>
                  <span className="font-medium text-gray-900">
                    {company.customers.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Total Farm Area:</span>
                  <span className="font-medium text-gray-900">
                    {company.customers.reduce(
                      (sum, farmer) => sum + farmer.total_farm_size_hectares,
                      0
                    ).toLocaleString()}{' '}
                    ha
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FertilizerCompanyList; 