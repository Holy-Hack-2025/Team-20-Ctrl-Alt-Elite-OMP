import React from 'react';
import { FarmerData, Fertilizer, CropRecommendation } from '../../types/agricultural';
import { 
  getSoilData, 
  getBestFertilizerMatch, 
  calculateFertilizerNeeds,
  getBestFertilizerForCrop,
  createCropRecommendation
} from '../../utils/fertilizerUtils';
import SoilCompositionPanel from './SoilCompositionPanel';
import CropRecommendationCard from './CropRecommendationCard';

type FarmerDetailsProps = {
  farmer: FarmerData;
  fertilizers: Fertilizer[];
};

const FarmerDetails: React.FC<FarmerDetailsProps> = ({ farmer, fertilizers }) => {
  // Get single best fertilizer for the whole farm
  const bestFarmFertilizer = getBestFertilizerMatch(farmer, fertilizers);
  const totalRequiredAmount = bestFarmFertilizer ? calculateFertilizerNeeds(farmer, bestFarmFertilizer) : 0;
  
  // Convert soil_composition to soil_data format 
  const soilData = getSoilData(farmer);
  
  // Calculate fertilizer requirements for each crop - with ONE fertilizer per crop
  const cropSpecificRequirements: CropRecommendation[] = farmer.crops
    ? farmer.crops
      .map(crop => {
        // Get the best fertilizer specifically for this crop
        const bestCropFertilizer = getBestFertilizerForCrop(crop, soilData, fertilizers);
        if (!bestCropFertilizer) return null;
        
        // Create full recommendation
        return createCropRecommendation(crop, soilData, bestCropFertilizer);
      })
      .filter((item): item is CropRecommendation => item !== null)
    : [];
  
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium text-gray-900">{farmer.farm_name}</h4>
          <p className="text-sm text-gray-600">{farmer.name}</p>
        </div>
        <span className="text-sm font-medium text-green-600">
          {farmer.total_farm_size_hectares} ha
        </span>
      </div>
      <div className="mt-2 text-sm text-gray-600">
        {farmer.location.city}, {farmer.location.region}
      </div>
      
      {/* Soil Composition */}
      <SoilCompositionPanel farmer={farmer} />
      
      {/* Crop-specific recommendations */}
      <div className="mt-3 p-3 bg-gray-50 rounded-md">
        <p className="text-sm font-medium text-gray-800 flex justify-between">
          <span>Fertilizer Recommendations by Crop</span>
          <span className="text-xs font-normal text-gray-600">Optimized using MSE analysis</span>
        </p>
        
        {bestFarmFertilizer && (
          <div className="mt-2 text-xs text-gray-500 bg-gray-100 p-2 rounded mb-3">
            <p>Note: A single farm-wide recommendation ({bestFarmFertilizer.title}, {Math.round(totalRequiredAmount).toLocaleString()} kg) is also available but may be less precise.</p>
          </div>
        )}
        
        {farmer.crops && farmer.crops.length > 0 && cropSpecificRequirements.length > 0 ? (
          <div className="space-y-3">
            {cropSpecificRequirements.map((crop, idx) => (
              <CropRecommendationCard 
                key={idx} 
                crop={crop} 
                farmer={farmer} 
                fertilizers={fertilizers} 
              />
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-gray-500">
            No crop data available for specific recommendations
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerDetails; 