import React from 'react';
import { CropRecommendation, FarmerData, Fertilizer } from '../../types/agricultural';
import { calculateCropFertilizerQuality } from '../../utils/fertilizerUtils';

// Extend the CropRecommendation type to include lime
type ExtendedCropRecommendation = CropRecommendation & {
  limeDeficiency?: number;
  limeNeeded?: number;
};

type CropRecommendationCardProps = {
  crop: CropRecommendation;
  farmer: FarmerData;
  fertilizers: Fertilizer[];
};

const CropRecommendationCard: React.FC<CropRecommendationCardProps> = ({
  crop,
  farmer,
  fertilizers
}) => {
  // Calculate lime deficiency if not already provided
  const extendedCrop: ExtendedCropRecommendation = {
    ...crop,
    limeDeficiency: crop.limeDeficiency || calculateLimeDeficiency(farmer, crop.fieldSize),
    limeNeeded: crop.limeNeeded || estimateLimeNeeded(farmer, crop.fieldSize)
  };

  // Helper function to calculate lime deficiency
  function calculateLimeDeficiency(farmer: FarmerData, fieldSize: number): number {
    // Optimal pH for most crops is around 6.5-7.0
    // If soil pH is below 6.0, we consider it lime deficient
    const optimalPh = 6.5;
    const currentPh = farmer.soil_composition?.ph_level || 7.0;
    
    // Simple calculation: if pH is below optimal, calculate deficiency proportional to difference
    if (currentPh < optimalPh) {
      // Scale deficiency by field size and pH difference (0.5 pH difference = 100kg/ha lime needed)
      return Math.round((optimalPh - currentPh) * 200 * fieldSize);
    }
    return 0;
  }

  // Helper function to estimate lime needed
  function estimateLimeNeeded(farmer: FarmerData, fieldSize: number): number {
    // Base lime requirement for acidic soils (kg/ha)
    const baseLimeRequirement = 500;
    const currentPh = farmer.soil_composition?.ph_level || 7.0;
    
    if (currentPh < 6.0) {
      return Math.round(baseLimeRequirement * fieldSize);
    }
    return 0;
  }

  return (
    <div className="p-3 bg-green-50 rounded-md">
      <div className="flex justify-between">
        <span className="text-sm font-medium text-green-800">{crop.cropName}</span>
        <span className="text-xs font-medium text-green-600">{crop.fieldSize} ha</span>
      </div>
      
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="bg-white p-2 rounded border border-green-100">
          <p className="text-xs font-medium text-gray-900">Recommended Fertilizer:</p>
          <p className="text-sm font-medium text-green-700">{crop.fertilizerName}</p>
          <p className="text-xs text-green-800 mt-1">Total amount needed: {crop.fertilizerAmount.toLocaleString()} kg for {crop.fieldSize} ha</p>
          
          {/* Crop-specific fertilizer match quality */}
          <div className="mt-2 pt-1 border-t border-green-50">
            <div className="flex items-center">
              <div className="w-full bg-green-100 rounded-full h-1.5">
                <div 
                  className="bg-green-500 h-1.5 rounded-full" 
                  style={{ 
                    width: `${calculateCropFertilizerQuality(crop, farmer, fertilizers.find(f => f.title === crop.fertilizerName) || null)}%` 
                  }}>
                </div>
              </div>
              <span className="ml-2 text-xs text-green-700">
                {calculateCropFertilizerQuality(crop, farmer, fertilizers.find(f => f.title === crop.fertilizerName) || null)}% match
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-2 rounded border border-green-100">
          <p className="text-xs font-medium text-gray-900">Nutrient Deficiencies:</p>
          <div className="grid grid-cols-1 gap-1 mt-1">
            <div className="text-xs flex justify-between">
              <span className="text-gray-600">Nitrogen:</span>
              <span className={crop.nitrogenDeficiency > 0 ? 'text-red-600' : 'text-green-600'}>
                {crop.nitrogenDeficiency > 0 ? `${(crop.nitrogenDeficiency / crop.fieldSize).toFixed(1)} kg/ha deficit` : 'OK'}
              </span>
            </div>
            <div className="text-xs flex justify-between">
              <span className="text-gray-600">Phosphorus:</span>
              <span className={crop.phosphorusDeficiency > 0 ? 'text-red-600' : 'text-green-600'}>
                {crop.phosphorusDeficiency > 0 ? `${(crop.phosphorusDeficiency / crop.fieldSize).toFixed(1)} kg/ha deficit` : 'OK'}
              </span>
            </div>
            <div className="text-xs flex justify-between">
              <span className="text-gray-600">Carbon:</span>
              <span className={crop.carbonDeficiency > 0 ? 'text-red-600' : 'text-green-600'}>
                {crop.carbonDeficiency > 0 ? `${(crop.carbonDeficiency / crop.fieldSize).toFixed(1)} kg/ha deficit` : 'OK'}
              </span>
            </div>
            <div className="text-xs flex justify-between">
              <span className="text-gray-600">Lime (pH):</span>
              <span className={extendedCrop.limeDeficiency && extendedCrop.limeDeficiency > 0 ? 'text-red-600' : 'text-green-600'}>
                {extendedCrop.limeDeficiency && extendedCrop.limeDeficiency > 0 
                  ? `${(extendedCrop.limeDeficiency / crop.fieldSize).toFixed(1)} kg/ha needed` 
                  : 'OK'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropRecommendationCard; 