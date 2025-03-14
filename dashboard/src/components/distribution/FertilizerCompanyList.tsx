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

  // Function to export fertilizer requirements data
  const exportFertilizerData = () => {
    // Create CSV headers
    let csvContent = "Company Name,Fertilizer Type,Amount (kg)\n";

    // Add data for each company
    summaries.forEach(company => {
      Object.entries(company.fertilizerTotals).forEach(([fertilizerName, amount]) => {
        csvContent += `${company.companyName},${fertilizerName},${amount}\n`;
      });
      // Add total for each company
      csvContent += `${company.companyName},Total,${company.totalAmount}\n\n`;
    });

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'fertilizer_requirements.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                  <p className="text-xs text-gray-500">
                    {company.monthly_capacity_kg?.toLocaleString()} kg capacity
                  </p>
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