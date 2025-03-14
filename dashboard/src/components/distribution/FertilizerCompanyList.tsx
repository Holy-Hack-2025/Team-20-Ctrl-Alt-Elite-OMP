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
  defaultEstablishmentType?: string; // Default establishment type from food waste sources
};

// New type for storing waste allocation data
type WasteAllocation = {
  companyId: string;
  companyName: string;
  allocation_kg: number;
  revenue_eur: number;
  cost_per_kg_eur: number;
  max_food_waste_percentage: number;
  isOverMaxLimit: boolean;
  maxAllowedKg: number;
  nutrientMatchScore?: number;
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

// Function to calculate optimal waste allocation based on payment rates and capacity
export const calculateOptimalWasteAllocation = (
  companies: FertilizerCompany[], 
  totalFoodWasteKg: number = 10000,
  establishmentType: string = "default",
  forceFullAllocation: boolean = false
): WasteAllocation[] => {
  // Get nutrient content for this type of establishment
  const nutrientContent = nutrientContentByEstablishmentType[establishmentType] || 
                         nutrientContentByEstablishmentType["default"];
  
  // Calculate initial equal distribution
  const baseAllocation = totalFoodWasteKg / companies.length;
  
  // First pass: Allocate respecting max percentages
  const allocations = companies.map(company => {
    const maxAllowedKg = (totalFoodWasteKg * (company.max_food_waste_percentage || 100)) / 100;
    const actualAllocation = Math.min(baseAllocation, maxAllowedKg);

    // Calculate nutrients in this allocation
    const nutrientsInAllocation = {
      nitrogen_kg: actualAllocation * nutrientContent.nitrogen_kg,
      phosphorus_kg: actualAllocation * nutrientContent.phosphorus_kg,
      carbon_kg: actualAllocation * nutrientContent.carbon_kg,
      lime_kg: actualAllocation * nutrientContent.lime_kg
    };

    // Set allocation percentage on company
    company.waste_allocation_percentage = Math.round((actualAllocation / totalFoodWasteKg) * 100);

    return {
      companyId: company.id,
      companyName: company.name,
      allocation_kg: actualAllocation,
      revenue_eur: actualAllocation * (company.cost_per_kg_eur || 0),
      cost_per_kg_eur: company.cost_per_kg_eur || 0,
      max_food_waste_percentage: company.max_food_waste_percentage || 0,
      isOverMaxLimit: false, // We're now respecting limits
      maxAllowedKg,
      nutrients: nutrientsInAllocation
    };
  });

  // Calculate remaining unallocated waste
  const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.allocation_kg, 0);
  const remainingWaste = totalFoodWasteKg - totalAllocated;

  // If force full allocation is enabled and there's remaining waste,
  // distribute it to companies that can still take more
  if (forceFullAllocation && remainingWaste > 0) {
    // Find companies that can take more waste
    const companiesWithCapacity = allocations
      .map((allocation, index) => ({
        allocation,
        remainingCapacity: allocation.maxAllowedKg - allocation.allocation_kg,
        index
      }))
      .filter(item => item.remainingCapacity > 0)
      .sort((a, b) => b.remainingCapacity - a.remainingCapacity);

    // Distribute remaining waste proportionally to available capacity
    if (companiesWithCapacity.length > 0) {
      let remainingToDistribute = remainingWaste;
      const totalRemainingCapacity = companiesWithCapacity.reduce((sum, item) => sum + item.remainingCapacity, 0);

      companiesWithCapacity.forEach(({ allocation, remainingCapacity }) => {
        if (remainingToDistribute <= 0) return;

        const share = (remainingCapacity / totalRemainingCapacity) * remainingWaste;
        const additionalAllocation = Math.min(share, remainingCapacity);

        // Update allocation
        allocation.allocation_kg += additionalAllocation;
        allocation.revenue_eur = allocation.allocation_kg * allocation.cost_per_kg_eur;
        
        // Update nutrients
        if (allocation.nutrients) {
          allocation.nutrients.nitrogen_kg += additionalAllocation * nutrientContent.nitrogen_kg;
          allocation.nutrients.phosphorus_kg += additionalAllocation * nutrientContent.phosphorus_kg;
          allocation.nutrients.carbon_kg += additionalAllocation * nutrientContent.carbon_kg;
          allocation.nutrients.lime_kg += additionalAllocation * nutrientContent.lime_kg;
        }

        // Update company percentage
        const company = companies.find(c => c.id === allocation.companyId);
        if (company) {
          company.waste_allocation_percentage = Math.round((allocation.allocation_kg / totalFoodWasteKg) * 100);
        }

        remainingToDistribute -= additionalAllocation;
      });
    }
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
  defaultEstablishmentType = "default"
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
  const [establishmentType, setEstablishmentType] = useState<string>(defaultEstablishmentType);
  // Add state for force full allocation
  const [forceFullAllocation, setForceFullAllocation] = useState<boolean>(false);

  // Update establishment type when defaultEstablishmentType changes
  useEffect(() => {
    setEstablishmentType(defaultEstablishmentType);
  }, [defaultEstablishmentType]);

  // Calculate allocations when component mounts or companies/total waste changes
  useEffect(() => {
    const allocations = calculateOptimalWasteAllocation(
      fertilizerCompanies, 
      totalFoodWasteKg,
      establishmentType,
      forceFullAllocation
    );
    setWasteAllocations(allocations);
    
    // Calculate total revenue
    const revenue = allocations.reduce((sum, alloc) => sum + alloc.revenue_eur, 0);
    setTotalRevenue(revenue);
  }, [fertilizerCompanies, totalFoodWasteKg, establishmentType, forceFullAllocation]);

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

  // Add establishment type selector
  const handleEstablishmentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEstablishmentType(e.target.value);
  };

  // Add handler for force full allocation toggle
  const handleForceFullAllocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForceFullAllocation(e.target.checked);
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
        </div>
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
                  {wasteAllocation && (
                    <div className="mt-1">
                      <div className="flex items-center justify-end">
                        {wasteAllocation.isOverMaxLimit && (
                          <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded">
                            Exceeds Limit
                          </span>
                        )}
                      </div>
                      {wasteAllocation.isOverMaxLimit && (
                        <p className="text-xs text-red-600 mt-1">
                          Max allowed: {wasteAllocation.maxAllowedKg.toLocaleString()} kg
                        </p>
                      )}
                      {wasteAllocation.nutrientMatchScore && (
                        <p className="text-xs mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {(wasteAllocation.nutrientMatchScore * 100).toFixed(0)}% nutrient match
                          </span>
                        </p>
                      )}
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
                          <span className="font-medium text-gray-900">
                            {Math.min(
                              wasteAllocation.nutrients.nitrogen_kg,
                              calculateNutrientRequirements(companySummary.fertilizerTotals, fertilizers)['Nitrogen'] > 0 
                                ? calculateNutrientRequirements(companySummary.fertilizerTotals, fertilizers)['Nitrogen'] * (wasteAllocation.max_food_waste_percentage / 100)
                                : 50
                            ).toFixed(2)} kg
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Phosphorus:</span>
                          <span className="font-medium text-gray-900">
                            {Math.min(
                              wasteAllocation.nutrients.phosphorus_kg,
                              calculateNutrientRequirements(companySummary.fertilizerTotals, fertilizers)['Phosphorus'] > 0
                                ? calculateNutrientRequirements(companySummary.fertilizerTotals, fertilizers)['Phosphorus'] * (wasteAllocation.max_food_waste_percentage / 100)
                                : 50
                            ).toFixed(2)} kg
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Carbon:</span>
                          <span className="font-medium text-gray-900">
                            {Math.min(
                              wasteAllocation.nutrients.carbon_kg,
                              calculateNutrientRequirements(companySummary.fertilizerTotals, fertilizers)['Carbon'] > 0
                                ? calculateNutrientRequirements(companySummary.fertilizerTotals, fertilizers)['Carbon'] * (wasteAllocation.max_food_waste_percentage / 100)
                                : 50
                            ).toFixed(2)} kg
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Lime:</span>
                          <span className="font-medium text-gray-900">
                            {Math.min(
                              wasteAllocation.nutrients.lime_kg,
                              calculateNutrientRequirements(companySummary.fertilizerTotals, fertilizers)['Lime'] > 0
                                ? calculateNutrientRequirements(companySummary.fertilizerTotals, fertilizers)['Lime'] * (wasteAllocation.max_food_waste_percentage / 100)
                                : 50
                            ).toFixed(2)} kg
                          </span>
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