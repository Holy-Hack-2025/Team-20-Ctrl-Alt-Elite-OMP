import React from 'react';
import { FertilizerCompany, Fertilizer } from '../../types/agricultural';
import FarmerDetails from './FarmerDetails';

type FarmerDistributionProps = {
  selectedCompany: string | null;
  fertilizerCompanies: FertilizerCompany[];
  fertilizers: Fertilizer[];
};

const FarmerDistribution: React.FC<FarmerDistributionProps> = ({
  selectedCompany,
  fertilizerCompanies,
  fertilizers
}) => {
  const selectedCompanyData = selectedCompany 
    ? fertilizerCompanies.find(c => c.id === selectedCompany)
    : null;

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="font-medium text-gray-900 mb-4">Farmer Distribution</h3>
      {selectedCompany ? (
        <div className="space-y-3">
          {selectedCompanyData?.customers.map((farmer) => (
            <FarmerDetails
              key={farmer.id}
              farmer={farmer}
              fertilizers={fertilizers}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Select a fertilizer company to view farmer details
        </div>
      )}
    </div>
  );
};

export default FarmerDistribution; 