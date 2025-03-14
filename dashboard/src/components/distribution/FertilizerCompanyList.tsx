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

// Function to calculate optimal waste allocation to maximize profit
export const calculateOptimalWasteAllocation = (
  companies: FertilizerCompany[], 
  totalFoodWasteKg: number = 10000, // Default to 10 tons if not specified
  establishmentType: string = "default", // Default establishment type for nutrient content
  forceFullAllocation: boolean = false // Whether to force allocation of all waste
): WasteAllocation[] => {
  // Get nutrient content for this type of establishment
  const nutrientContent = nutrientContentByEstablishmentType[establishmentType] || 
                          nutrientContentByEstablishmentType["default"];
  
  // First pass: calculate each company's fertilizer needs and nutrient requirements
  const companyData = companies.map(company => {
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
    
    // Calculate nutrient match score - how well this waste source matches this company's needs
    // Higher score means better match
    let nutrientMatchScore = 1.0; // Default score
    
    // If we have detailed customer data with crops, calculate nutrient match
    if (company.customers.some(farmer => farmer.crops && farmer.crops.length > 0)) {
      const nutrientNeeds = {
        nitrogen: 0,
        phosphorus: 0,
        carbon: 0,
        lime: 0
      };
      
      // Calculate total nutrient needs for this company
      company.customers.forEach(farmer => {
        if (farmer.crops) {
          farmer.crops.forEach(crop => {
            const area = crop.field_size_hectares;
            
            // Add nitrogen needs
            nutrientNeeds.nitrogen += (crop.soil_requirements.nitrogen_needs_kg_per_hectare || 0) * area;
            
            // Add phosphorus needs if available
            if (crop.soil_requirements.phosphorus_needs_kg_per_hectare) {
              nutrientNeeds.phosphorus += crop.soil_requirements.phosphorus_needs_kg_per_hectare * area;
            }
            
            // Add carbon needs if available
            if (crop.soil_requirements.carbon_needs_kg_per_hectare) {
              nutrientNeeds.carbon += crop.soil_requirements.carbon_needs_kg_per_hectare * area;
            }
          });
        }
      });
      
      // Calculate match score based on nutrient composition
      // Higher score for better matches between waste nutrients and company needs
      const nitrogenMatch = nutrientContent.nitrogen_kg > 0 ? 
        Math.min(nutrientNeeds.nitrogen / (totalFoodWasteKg * nutrientContent.nitrogen_kg), 1) : 0;
      
      const phosphorusMatch = nutrientContent.phosphorus_kg > 0 && nutrientNeeds.phosphorus > 0 ? 
        Math.min(nutrientNeeds.phosphorus / (totalFoodWasteKg * nutrientContent.phosphorus_kg), 1) : 0;
      
      const carbonMatch = nutrientContent.carbon_kg > 0 && nutrientNeeds.carbon > 0 ? 
        Math.min(nutrientNeeds.carbon / (totalFoodWasteKg * nutrientContent.carbon_kg), 1) : 0;
      
      // Calculate weighted match score
      nutrientMatchScore = (nitrogenMatch * 0.5) + (phosphorusMatch * 0.3) + (carbonMatch * 0.2) + 0.5;
    }
    
    return {
      company,
      fertilizerNeeds,
      maxWaste,
      nutrientMatchScore,
      // Economic value score combines price offered and nutrient match
      economicValueScore: (company.cost_per_kg_eur || 0) * nutrientMatchScore
    };
  });
  
  // Sort by economic value score (price * nutrient match), highest first
  const sortedCompanyData = [...companyData].sort((a, b) => 
    b.economicValueScore - a.economicValueScore
  );
  
  // Second pass: allocate waste based on economic value and maximum capacity
  let remainingWaste = totalFoodWasteKg;
  const allocations: WasteAllocation[] = [];
  
  for (const data of sortedCompanyData) {
    if (remainingWaste <= 0) break;
    
    // Allocate minimum of what's available and what company can accept
    const allocation = Math.min(remainingWaste, data.maxWaste);
    
    // Calculate the nutrient content in this allocation
    const nutrientsInAllocation = {
      nitrogen_kg: allocation * nutrientContent.nitrogen_kg,
      phosphorus_kg: allocation * nutrientContent.phosphorus_kg,
      carbon_kg: allocation * nutrientContent.carbon_kg,
      lime_kg: allocation * nutrientContent.lime_kg
    };
    
    allocations.push({
      companyId: data.company.id,
      companyName: data.company.name,
      allocation_kg: allocation,
      revenue_eur: allocation * (data.company.cost_per_kg_eur || 0),
      cost_per_kg_eur: data.company.cost_per_kg_eur || 0,
      max_food_waste_percentage: data.company.max_food_waste_percentage || 0,
      nutrients: nutrientsInAllocation,
      nutrientMatchScore: data.nutrientMatchScore
    });
    
    remainingWaste -= allocation;
  }
  
  // Third pass: if we need to force full allocation and there's still waste left,
  // distribute remaining waste to all companies proportionally
  if (forceFullAllocation && remainingWaste > 0 && allocations.length > 0) {
    // Calculate total current allocation
    const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.allocation_kg, 0);
    
    // Distribute remaining waste based on current allocation proportions
    allocations.forEach(allocation => {
      const proportion = allocation.allocation_kg / totalAllocated;
      const additionalWaste = remainingWaste * proportion;
      
      // Update allocation with additional waste
      allocation.allocation_kg += additionalWaste;
      allocation.revenue_eur += additionalWaste * allocation.cost_per_kg_eur;
      
      // Update nutrient content
      if (allocation.nutrients) {
        allocation.nutrients.nitrogen_kg += additionalWaste * nutrientContent.nitrogen_kg;
        allocation.nutrients.phosphorus_kg += additionalWaste * nutrientContent.phosphorus_kg;
        allocation.nutrients.carbon_kg += additionalWaste * nutrientContent.carbon_kg;
        allocation.nutrients.lime_kg += additionalWaste * nutrientContent.lime_kg;
      }
    });
    
    // All waste is now allocated
    remainingWaste = 0;
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

  // Export waste allocation data to CSV
  const exportWasteAllocationData = () => {
    const headers = ['Company Name', 'Allocation (kg)', 'Allocation (%)', 'Nutrient Match (%)', 'Revenue (EUR)', 'Cost per kg (EUR)', 'Max Waste %'];
    let csvContent = headers.join(',') + '\n';

    // Add company rows
    wasteAllocations.forEach(allocation => {
      const allocationPercentage = ((allocation.allocation_kg / totalFoodWasteKg) * 100).toFixed(1);
      const nutrientMatch = allocation.nutrientMatchScore ? (allocation.nutrientMatchScore * 100).toFixed(0) : 'N/A';
      csvContent += `${allocation.companyName},${allocation.allocation_kg.toFixed(2)},${allocationPercentage}%,${nutrientMatch}%,${allocation.revenue_eur.toFixed(2)},${allocation.cost_per_kg_eur.toFixed(2)},${allocation.max_food_waste_percentage}\n`;
    });

    // Add total row
    const totalAllocation = wasteAllocations.reduce((sum, alloc) => sum + alloc.allocation_kg, 0);
    const totalAllocationPercentage = ((totalAllocation / totalFoodWasteKg) * 100).toFixed(1);
    csvContent += `Total,${totalAllocation.toFixed(2)},${totalAllocationPercentage}%,,${totalRevenue.toFixed(2)},,\n`;

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
          <button
            onClick={exportWasteAllocationData}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200"
          >
            Export Allocations
          </button>
        </div>
      </div>
      
      {/* Controls for waste allocation settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Establishment type selector */}
        <div>
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
        
        {/* Force full allocation toggle */}
        <div className="flex items-center h-full pt-5">
          <label className="inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              value="" 
              className="sr-only peer" 
              checked={forceFullAllocation}
              onChange={handleForceFullAllocationChange}
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            <span className="ms-3 text-sm font-medium text-gray-700">Force Full Allocation</span>
          </label>
          <div className="ml-2 text-gray-500 cursor-help" title="When enabled, all available waste will be allocated to companies, even exceeding their preferred limits if necessary.">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Display total waste and revenue information */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-600">Total Food Waste</h4>
            <p className="text-xl font-bold text-blue-700">{totalFoodWasteKg.toLocaleString()} kg</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-600">Primary Source Type</h4>
            <p className="text-xl font-bold text-blue-700">{establishmentType}</p>
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
                    <p className={`text-md font-bold ${unallocated > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {unallocated.toLocaleString()} kg ({unallocatedPercentage}%)
                      {unallocated > 0 && !forceFullAllocation && (
                        <span className="text-xs ml-2 text-gray-500">
                          (Enable "Force Full Allocation" to use all waste)
                        </span>
                      )}
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