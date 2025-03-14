import React from 'react';
import { FarmerData } from '../../types/agricultural';

type SoilCompositionPanelProps = {
  farmer: FarmerData;
};

const SoilCompositionPanel: React.FC<SoilCompositionPanelProps> = ({ farmer }) => {
  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-md">
      <p className="text-sm font-medium text-gray-800 mb-2">Current Soil Composition</p>
      <div className="grid grid-cols-3 gap-2">
        <div className="text-xs">
          <span className="text-gray-600">Nitrogen:</span>
          <span className="ml-1 font-medium">
            {farmer.soil_composition?.nitrogen_level_ppm || 0} ppm
          </span>
        </div>
        <div className="text-xs">
          <span className="text-gray-600">Phosphorus:</span>
          <span className="ml-1 font-medium">
            {farmer.soil_composition?.phosphorus_level_ppm || 0} ppm
          </span>
        </div>
        <div className="text-xs">
          <span className="text-gray-600">Carbon:</span>
          <span className="font-semibold">
            {farmer.soil_composition?.carbon_level_ppm || 0} ppm
          </span>
        </div>
      </div>
    </div>
  );
};

export default SoilCompositionPanel; 