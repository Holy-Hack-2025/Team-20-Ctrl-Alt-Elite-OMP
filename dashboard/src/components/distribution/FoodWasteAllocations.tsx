import React from 'react';
import { FertilizerCompany, Fertilizer } from '../../types/agricultural';
import FertilizerCompanyList from './FertilizerCompanyList';
import FarmerDistribution from './FarmerDistribution';

type FoodWasteAllocationsProps = {
  fertilizerCompanies: FertilizerCompany[];
  fertilizers: Fertilizer[];
  selectedCompany: string | null;
  setSelectedCompany: (id: string) => void;
};

const FoodWasteAllocations: React.FC<FoodWasteAllocationsProps> = ({
  fertilizerCompanies,
  fertilizers,
  selectedCompany,
  setSelectedCompany
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm mb-6">
      <div className="p-5 border-b border-gray-100">
        <h2 className="text-lg font-medium text-gray-800">Food Waste Allocations</h2>
        <p className="text-sm text-gray-600 mt-1">Distribution of food waste to fertilizer companies</p>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fertilizer Companies Overview */}
          <FertilizerCompanyList
            fertilizerCompanies={fertilizerCompanies}
            selectedCompany={selectedCompany}
            setSelectedCompany={setSelectedCompany}
            fertilizers={fertilizers}
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