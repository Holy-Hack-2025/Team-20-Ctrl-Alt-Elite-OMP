import React, { useEffect, useState } from 'react';
import { FertilizerCompany, CropRecommendation, Fertilizer } from '../../types/agricultural';
import { getBestFertilizerForCrop, getSoilData, createCropRecommendation } from '../../utils/fertilizerUtils';

type FertilizerCompanyListProps = {
  fertilizerCompanies: FertilizerCompany[];
  selectedCompany: string | null;
  setSelectedCompany: (id: string) => void;
  fertilizers: Fertilizer[];
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
  fertilizers
}) => {
  // State to store fertilizer recommendations
  const [recommendations, setRecommendations] = useState<FertilizerRecommendations[]>([]);
  // State to store fertilizer summaries
  const [summaries, setSummaries] = useState<FertilizerSummary[]>([]);

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

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-gray-900">Fertilizer Companies</h3>
        <button
          onClick={exportFertilizerData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
        >
          Export Requirements
        </button>
      </div>
      <div className="space-y-3">
        {fertilizerCompanies.map((company: FertilizerCompany) => {
          const companySummary = summaries.find(s => s.companyId === company.id);
          
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
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-blue-600">
                    {company.waste_allocation_percentage}% Allocation
                  </span>
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