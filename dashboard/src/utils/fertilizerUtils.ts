import { 
  FarmerData, 
  Fertilizer, 
  SoilData, 
  CropData, 
  CropRecommendation 
} from '../types/agricultural';

// Helper to get soil data from farmer
export const getSoilData = (farmer: FarmerData): SoilData => {
  return farmer.soil_data || {
    nitrogen: farmer.soil_composition?.nitrogen_level_ppm || 0,
    phosphorus: farmer.soil_composition?.phosphorus_level_ppm || 0,
    carbon: farmer.soil_composition?.carbon_level_ppm || 0,
    lime: 0
  };
};

// Function to calculate required fertilizer amount for a farmer
export const calculateFertilizerNeeds = (farmer: FarmerData, fertilizer: Fertilizer): number => {
  if (!farmer.soil_data && !farmer.soil_composition) return 0;
  if (!farmer.crops || farmer.crops.length === 0) return 0;
  const soilData = getSoilData(farmer);

  let totalFertilizerNeeded = 0;
  farmer.crops.forEach(crop => {
    const cropArea = crop.field_size_hectares;
    const nitrogenNeedsPerHectare = crop.soil_requirements.nitrogen_needs_kg_per_hectare;
    const phosphorusNeedsPerHectare = crop.soil_requirements.phosphorus_needs_kg_per_hectare || 0;
    const carbonNeedsPerHectare = crop.soil_requirements.carbon_needs_kg_per_hectare || 0;
    const calciumNeedsPerHectare = crop.soil_requirements.calcium_needs_kg_per_hectare || 0;
    const magnesiumNeedsPerHectare = crop.soil_requirements.magnesium_needs_kg_per_hectare || 0;
    const sulfurNeedsPerHectare = crop.soil_requirements.sulfur_needs_kg_per_hectare || 0;
    const optimalSoilComposition = crop.soil_requirements.optimal_soil_composition;
    let fertilizerEfficiency = 0;
    let componentMatches = 0;
    
    fertilizer.components.forEach(component => {
      const componentName = component.name.toLowerCase();
      if (componentName === 'nitrogen' && nitrogenNeedsPerHectare > 0) {
        const soilNitrogenLevel = soilData.nitrogen;
        let deficiency;
        if (optimalSoilComposition) {
          deficiency = Math.max(0, optimalSoilComposition.nitrogen_ppm - soilNitrogenLevel);
        } else {
          deficiency = Math.max(0, nitrogenNeedsPerHectare - soilNitrogenLevel);
        }
        if (deficiency > 0) {
          const target = optimalSoilComposition ? optimalSoilComposition.nitrogen_ppm : nitrogenNeedsPerHectare;
          fertilizerEfficiency += (component.percentage / 100) * (deficiency / target);
          componentMatches++;
        }
      } else if (componentName === 'carbon' && carbonNeedsPerHectare > 0) {
        const soilCarbonLevel = soilData.carbon;
        let deficiency;
        if (optimalSoilComposition) {
          deficiency = Math.max(0, optimalSoilComposition.carbon_ppm - soilCarbonLevel);
        } else {
          deficiency = Math.max(0, carbonNeedsPerHectare - soilCarbonLevel);
        }
        if (deficiency > 0) {
          const target = optimalSoilComposition ? optimalSoilComposition.carbon_ppm : carbonNeedsPerHectare;
          fertilizerEfficiency += (component.percentage / 100) * (deficiency / target);
          componentMatches++;
        }
      }
    });
    
    if (componentMatches > 0) {
      const avgEfficiency = fertilizerEfficiency / componentMatches;
      const cropSpecificAmount = (fertilizer.baseAmount * cropArea * avgEfficiency);
      totalFertilizerNeeded += cropSpecificAmount;
    }
  });

  if (totalFertilizerNeeded === 0) {
    let totalDeficiency = 0;
    let componentsCount = 0;
    fertilizer.components.forEach(component => {
      const currentLevel = soilData[component.name.toLowerCase() as keyof SoilData] || 0;
      if (currentLevel < component.soilTarget) {
        const deficiency = component.soilTarget - currentLevel;
        totalDeficiency += deficiency;
        componentsCount++;
      }
    });
    if (componentsCount === 0) return 0;
    const averageDeficiency = totalDeficiency / componentsCount;
    const baseAmount = fertilizer.baseAmount * (averageDeficiency / 100);
    totalFertilizerNeeded = baseAmount * farmer.total_farm_size_hectares;
  }

  return totalFertilizerNeeded;
};

// Function to get the best fertilizer match for a farmer
export const getBestFertilizerMatch = (farmer: FarmerData, fertilizers: Fertilizer[]): Fertilizer | null => {
  if (!farmer.soil_data && !farmer.soil_composition) return null;
  const soilData = getSoilData(farmer);

  // Calculate crop requirements
  const cropRequirements: { [key: string]: number } = {
    nitrogen: 0,
    phosphorus: 0,
    carbon: 0,
    calcium: 0,
    magnesium: 0,
    sulfur: 0,
    lime: 0
  };

  // Calculate target nutrient levels
  const targetLevels: { [key: string]: number } = {
    nitrogen: 0,
    phosphorus: 0,
    carbon: 0,
    calcium: 0,
    magnesium: 0,
    sulfur: 0,
    lime: 0
  };

  let totalCropArea = 0;
  if (farmer.crops && farmer.crops.length > 0) {
    farmer.crops.forEach(crop => {
      totalCropArea += crop.field_size_hectares;
      
      // Add weighted requirements for all nutrients
      cropRequirements.nitrogen += (crop.soil_requirements.nitrogen_needs_kg_per_hectare || 0) * crop.field_size_hectares;
      cropRequirements.phosphorus += (crop.soil_requirements.phosphorus_needs_kg_per_hectare || 0) * crop.field_size_hectares;
      cropRequirements.carbon += (crop.soil_requirements.carbon_needs_kg_per_hectare || 0) * crop.field_size_hectares;
      
      // Use optimal soil composition if available
      if (crop.soil_requirements.optimal_soil_composition) {
        const optimal = crop.soil_requirements.optimal_soil_composition;
        const area = crop.field_size_hectares;
        
        targetLevels.nitrogen += (optimal.nitrogen_ppm || 0) * area;
        targetLevels.phosphorus += (optimal.phosphorus_ppm || 0) * area;
        targetLevels.carbon += (optimal.carbon_ppm || 0) * area;
      }
    });
    
    // Calculate averages
    if (totalCropArea > 0) {
      Object.keys(cropRequirements).forEach(nutrient => {
        cropRequirements[nutrient] /= totalCropArea;
      });
      
      Object.keys(targetLevels).forEach(nutrient => {
        targetLevels[nutrient] /= totalCropArea;
        // If no optimal level was specified, use current level + requirements
        if (targetLevels[nutrient] === 0) {
          const currentLevel = soilData[nutrient as keyof SoilData] || 0;
          targetLevels[nutrient] = currentLevel + cropRequirements[nutrient];
        }
      });
    }
  } else {
    // If no crops, use soil targets from the fertilizer
    fertilizers.forEach(fertilizer => {
      fertilizer.components.forEach(component => {
        const nutrient = component.name.toLowerCase();
        if (targetLevels[nutrient] !== undefined) {
          targetLevels[nutrient] = Math.max(targetLevels[nutrient], component.soilTarget);
        }
      });
    });
  }

  // Find fertilizer that minimizes mean squared error
  return fertilizers.reduce((best, current) => {
    // Calculate MSE for current fertilizer
    let currentMSE = 0;
    let nutrientCount = 0;
    
    // For each nutrient in the soil
    Object.keys(targetLevels).forEach(nutrient => {
      if (targetLevels[nutrient] > 0) {
        // Find corresponding component in fertilizer
        const component = current.components.find(c => c.name.toLowerCase() === nutrient);
        
        // Current soil level
        const currentLevel = soilData[nutrient as keyof SoilData] || 0;
        
        // Target level for this nutrient
        const targetLevel = targetLevels[nutrient];
        
        // Calculate expected level after fertilizer application
        let expectedLevel = currentLevel;
        
        if (component) {
          // Simple model: assume fertilizer component will increase level proportionally
          // to its percentage and a base application rate
          const expectedIncrease = (component.percentage / 100) * current.baseAmount;
          expectedLevel = currentLevel + expectedIncrease;
        }
        
        // Calculate squared error for this nutrient
        const squaredError = Math.pow(targetLevel - expectedLevel, 2);
        currentMSE += squaredError;
        nutrientCount++;
      }
    });
    
    // Calculate mean
    if (nutrientCount > 0) {
      currentMSE /= nutrientCount;
    } else {
      // If no nutrients to compare, default to high MSE
      currentMSE = Number.MAX_VALUE;
    }
    
    // Compare with best fertilizer so far
    if (!best) return current;
    
    // Calculate MSE for best fertilizer
    let bestMSE = 0;
    nutrientCount = 0;
    
    Object.keys(targetLevels).forEach(nutrient => {
      if (targetLevels[nutrient] > 0) {
        const component = best.components.find(c => c.name.toLowerCase() === nutrient);
        const currentLevel = soilData[nutrient as keyof SoilData] || 0;
        const targetLevel = targetLevels[nutrient];
        
        let expectedLevel = currentLevel;
        if (component) {
          const expectedIncrease = (component.percentage / 100) * best.baseAmount;
          expectedLevel = currentLevel + expectedIncrease;
        }
        
        bestMSE += Math.pow(targetLevel - expectedLevel, 2);
        nutrientCount++;
      }
    });
    
    if (nutrientCount > 0) {
      bestMSE /= nutrientCount;
    } else {
      bestMSE = Number.MAX_VALUE;
    }
    
    // Return the fertilizer with the lower MSE
    return currentMSE < bestMSE ? current : best;
  }, null as Fertilizer | null);
};

// Function to get the best fertilizer specifically for a crop
export const getBestFertilizerForCrop = (crop: CropData, soilData: SoilData, fertilizers: Fertilizer[]): Fertilizer | null => {
  // Get optimal soil composition for target crop
  const optimalSoilComposition = crop.soil_requirements.optimal_soil_composition;
  
  // Calculate target nutrient levels
  const targetLevels: { [key: string]: number } = {
    nitrogen: 0,
    phosphorus: 0,
    carbon: 0,
    calcium: 0,
    magnesium: 0,
    sulfur: 0,
    lime: 0
  };
  
  // Set target levels based on optimal composition if available, otherwise use requirements
  if (optimalSoilComposition) {
    targetLevels.nitrogen = optimalSoilComposition.nitrogen_ppm || 0;
    targetLevels.phosphorus = optimalSoilComposition.phosphorus_ppm || 0;
    targetLevels.carbon = optimalSoilComposition.carbon_ppm || 0;
    targetLevels.calcium = (soilData.calcium || 0) + (crop.soil_requirements.calcium_needs_kg_per_hectare || 0);
    targetLevels.magnesium = optimalSoilComposition.magnesium_ppm || 0;
    targetLevels.sulfur = optimalSoilComposition.sulfur_ppm || 0;
  } else {
    // If no optimal composition, calculate target as current + requirements
    targetLevels.nitrogen = (soilData.nitrogen || 0) + (crop.soil_requirements.nitrogen_needs_kg_per_hectare || 0);
    targetLevels.phosphorus = (soilData.phosphorus || 0) + (crop.soil_requirements.phosphorus_needs_kg_per_hectare || 0);
    targetLevels.carbon = (soilData.carbon || 0) + (crop.soil_requirements.carbon_needs_kg_per_hectare || 0);
    targetLevels.calcium = (soilData.calcium || 0) + (crop.soil_requirements.calcium_needs_kg_per_hectare || 0);
    targetLevels.magnesium = 0 + (crop.soil_requirements.magnesium_needs_kg_per_hectare || 0);
    targetLevels.sulfur = 0 + (crop.soil_requirements.sulfur_needs_kg_per_hectare || 0);
  }
  
  // Add lime requirements based on pH
  // Most crops prefer pH between 6.0-7.0
  const optimalPh = 6.5;
  const currentPh = soilData.lime || 7.0; // Using lime property to store pH for simplicity
  if (currentPh < optimalPh) {
    // Simple calculation: if pH is below optimal, calculate lime needed
    targetLevels.lime = Math.round((optimalPh - currentPh) * 200 * crop.field_size_hectares);
  }

  // Find fertilizer that minimizes mean squared error
  return fertilizers.reduce((best, current) => {
    // Calculate MSE for current fertilizer
    let currentMSE = 0;
    let nutrientCount = 0;
    
    // For each nutrient in the soil
    Object.keys(targetLevels).forEach(nutrient => {
      if (targetLevels[nutrient] > 0) {
        // Find corresponding component in fertilizer
        const component = current.components.find(c => c.name.toLowerCase() === nutrient);
        
        // Current soil level
        const currentLevel = soilData[nutrient as keyof SoilData] || 0;
        
        // Target level for this nutrient
        const targetLevel = targetLevels[nutrient];
        
        // Calculate expected level after fertilizer application
        let expectedLevel = currentLevel;
        
        if (component) {
          // Simple model: assume fertilizer component will increase level proportionally
          // to its percentage and a base application rate
          const expectedIncrease = (component.percentage / 100) * current.baseAmount;
          expectedLevel = currentLevel + expectedIncrease;
        }
        
        // Calculate squared error for this nutrient
        const squaredError = Math.pow(targetLevel - expectedLevel, 2);
        currentMSE += squaredError;
        nutrientCount++;
      }
    });
    
    // Calculate mean
    if (nutrientCount > 0) {
      currentMSE /= nutrientCount;
    } else {
      // If no nutrients to compare, default to high MSE
      currentMSE = Number.MAX_VALUE;
    }
    
    // Compare with best fertilizer so far
    if (!best) return current;
    
    // Calculate MSE for best fertilizer
    let bestMSE = 0;
    nutrientCount = 0;
    
    Object.keys(targetLevels).forEach(nutrient => {
      if (targetLevels[nutrient] > 0) {
        const component = best.components.find(c => c.name.toLowerCase() === nutrient);
        const currentLevel = soilData[nutrient as keyof SoilData] || 0;
        const targetLevel = targetLevels[nutrient];
        
        let expectedLevel = currentLevel;
        if (component) {
          const expectedIncrease = (component.percentage / 100) * best.baseAmount;
          expectedLevel = currentLevel + expectedIncrease;
        }
        
        bestMSE += Math.pow(targetLevel - expectedLevel, 2);
        nutrientCount++;
      }
    });
    
    if (nutrientCount > 0) {
      bestMSE /= nutrientCount;
    } else {
      bestMSE = Number.MAX_VALUE;
    }
    
    // Return the fertilizer with the lower MSE
    return currentMSE < bestMSE ? current : best;
  }, null as Fertilizer | null);
};

// Calculate crop-specific fertilizer amount
export const calculateCropFertilizerAmount = (
  crop: CropData, 
  soilData: SoilData, 
  fertilizer: Fertilizer
): number => {
  if (!fertilizer) return 0;
  
  // Calculate efficiency for this fertilizer with this crop
  let fertilizerEfficiency = 0;
  let componentMatches = 0;
  
  // Get crop needs and current soil levels
  const nitrogenNeeded = crop.soil_requirements.nitrogen_needs_kg_per_hectare;
  const phosphorusNeeded = crop.soil_requirements.phosphorus_needs_kg_per_hectare || 0;
  const carbonNeeded = crop.soil_requirements.carbon_needs_kg_per_hectare || 0;
  const soilNitrogen = soilData.nitrogen;
  const soilPhosphorus = soilData.phosphorus;
  const soilCarbon = soilData.carbon;
  const optimalSoilComposition = crop.soil_requirements.optimal_soil_composition;
  
  // Get nutrient components from fertilizer
  const nitrogenComponent = fertilizer.components.find(c => c.name.toLowerCase() === 'nitrogen');
  const phosphorusComponent = fertilizer.components.find(c => c.name.toLowerCase() === 'phosphorus');
  const carbonComponent = fertilizer.components.find(c => c.name.toLowerCase() === 'carbon');
  
  // Calculate deficiencies
  const nitrogenDeficiency = optimalSoilComposition ? 
    Math.max(0, (optimalSoilComposition.nitrogen_ppm || 0) - soilNitrogen) : 
    Math.max(0, nitrogenNeeded - soilNitrogen);
  
  const phosphorusDeficiency = optimalSoilComposition ? 
    Math.max(0, (optimalSoilComposition.phosphorus_ppm || 0) - soilPhosphorus) : 
    Math.max(0, phosphorusNeeded - soilPhosphorus);
  
  const carbonDeficiency = optimalSoilComposition ? 
    Math.max(0, (optimalSoilComposition.carbon_ppm || 0) - soilCarbon) : 
    Math.max(0, carbonNeeded - soilCarbon);
  
  // Calculate total nutrient needs based on area
  const totalNitrogenNeeded = nitrogenNeeded * crop.field_size_hectares;
  const totalPhosphorusNeeded = phosphorusNeeded * crop.field_size_hectares;
  const totalCarbonNeeded = carbonNeeded * crop.field_size_hectares;
  
  // Calculate efficiency for each component
  if (nitrogenComponent && nitrogenDeficiency > 0) {
    const target = optimalSoilComposition ? 
      optimalSoilComposition.nitrogen_ppm : nitrogenNeeded;
    fertilizerEfficiency += (nitrogenComponent.percentage / 100) * (nitrogenDeficiency / (target || 1));
    componentMatches++;
  }
  
  if (phosphorusComponent && phosphorusDeficiency > 0) {
    const target = optimalSoilComposition ? 
      optimalSoilComposition.phosphorus_ppm : phosphorusNeeded;
    fertilizerEfficiency += (phosphorusComponent.percentage / 100) * (phosphorusDeficiency / (target || 1));
    componentMatches++;
  }
  
  if (carbonComponent && carbonDeficiency > 0) {
    const target = optimalSoilComposition ? 
      optimalSoilComposition.carbon_ppm : carbonNeeded;
    fertilizerEfficiency += (carbonComponent.percentage / 100) * (carbonDeficiency / (target || 1));
    componentMatches++;
  }
  
  // Calculate amount needed, ensuring we account for the total area
  let cropFertilizerAmount = 0;
  if (componentMatches > 0) {
    const avgEfficiency = fertilizerEfficiency / componentMatches;
    // Calculate per-hectare amount first, then multiply by total field size
    const perHectareAmount = fertilizer.baseAmount * avgEfficiency;
    cropFertilizerAmount = Math.round(perHectareAmount * crop.field_size_hectares);
  } else {
    // If no deficiencies, calculate a small maintenance amount (still based on total area)
    const perHectareAmount = fertilizer.baseAmount * 0.1; // 10% of base rate for maintenance
    cropFertilizerAmount = Math.round(perHectareAmount * crop.field_size_hectares);
  }
  
  return cropFertilizerAmount;
};

// Create full crop recommendation object
export const createCropRecommendation = (
  crop: CropData, 
  soilData: SoilData, 
  fertilizer: Fertilizer
): CropRecommendation | null => {
  if (!fertilizer) return null;
  
  // Calculate amount needed
  const fertilizerAmount = calculateCropFertilizerAmount(crop, soilData, fertilizer);
  
  // Get crop needs and calculate deficiencies
  const nitrogenNeeded = crop.soil_requirements.nitrogen_needs_kg_per_hectare;
  const phosphorusNeeded = crop.soil_requirements.phosphorus_needs_kg_per_hectare || 0;
  const carbonNeeded = crop.soil_requirements.carbon_needs_kg_per_hectare || 0;
  
  const optimalSoilComposition = crop.soil_requirements.optimal_soil_composition;
  
  const nitrogenDeficiency = optimalSoilComposition ? 
    Math.max(0, (optimalSoilComposition.nitrogen_ppm || 0) - soilData.nitrogen) : 
    Math.max(0, nitrogenNeeded - soilData.nitrogen);
  
  const phosphorusDeficiency = optimalSoilComposition ? 
    Math.max(0, (optimalSoilComposition.phosphorus_ppm || 0) - soilData.phosphorus) : 
    Math.max(0, phosphorusNeeded - soilData.phosphorus);
  
  const carbonDeficiency = optimalSoilComposition ? 
    Math.max(0, (optimalSoilComposition.carbon_ppm || 0) - soilData.carbon) : 
    Math.max(0, carbonNeeded - soilData.carbon);
    
  // Calculate lime deficiency based on pH requirements
  // Most crops prefer pH between 6.0-7.0, so we'll use 6.5 as a default target
  const optimalPh = 6.5;
  // We'll assume the pH is stored in the lime property of soilData for simplicity
  const currentPh = soilData.lime || 7.0;
  const limeDeficiency = currentPh < optimalPh ? 
    Math.round((optimalPh - currentPh) * 200 * crop.field_size_hectares) : 0;
  const limeNeeded = currentPh < 6.0 ? 
    Math.round(500 * crop.field_size_hectares) : 0;
  
  // Scale deficiencies by field size
  const scaledNitrogenDeficiency = nitrogenDeficiency * crop.field_size_hectares;
  const scaledPhosphorusDeficiency = phosphorusDeficiency * crop.field_size_hectares;  
  const scaledCarbonDeficiency = carbonDeficiency * crop.field_size_hectares;
  
  // Scale nutrient needs by field size
  const totalNitrogenNeeded = nitrogenNeeded * crop.field_size_hectares;
  const totalPhosphorusNeeded = phosphorusNeeded * crop.field_size_hectares;
  const totalCarbonNeeded = carbonNeeded * crop.field_size_hectares;
  
  return {
    cropName: crop.crop_name,
    fieldSize: crop.field_size_hectares,
    fertilizerName: fertilizer.title,
    fertilizerAmount,
    nitrogenNeeded: totalNitrogenNeeded,
    phosphorusNeeded: totalPhosphorusNeeded,
    carbonNeeded: totalCarbonNeeded,
    nitrogenDeficiency: scaledNitrogenDeficiency,
    phosphorusDeficiency: scaledPhosphorusDeficiency,
    carbonDeficiency: scaledCarbonDeficiency,
    limeDeficiency,
    limeNeeded
  };
};

// Helper function to calculate recommendation quality as a percentage (100% = perfect match)
export const calculateRecommendationQuality = (farmer: FarmerData, fertilizer: Fertilizer): number => {
  if (!farmer.soil_data && !farmer.soil_composition) return 0;
  const soilData = getSoilData(farmer);
  
  // Calculate total deficiency per hectare
  let totalDeficiencyPerHectare = 0;
  
  // Get total farm size for per hectare calculation
  const totalFarmSize = farmer.total_farm_size_hectares || 1;
  
  // Check each nutrient that the fertilizer provides
  fertilizer.components.forEach(component => {
    const nutrient = component.name.toLowerCase();
    const currentLevel = soilData[nutrient as keyof SoilData] || 0;
    
    // Calculate deficiency in kg/ha
    if (currentLevel < component.soilTarget) {
      const deficiency = component.soilTarget - currentLevel;
      totalDeficiencyPerHectare += deficiency;
    }
  });
  
  // Calculate quality score
  // Start at 100%, subtract 0.25% for each 1kg/ha of deficiency
  const qualityScore = Math.max(0, 100 - (totalDeficiencyPerHectare * 0.75));
  
  return parseFloat(qualityScore.toFixed(1));
};

// Helper function to calculate crop-specific fertilizer match quality
export const calculateCropFertilizerQuality = (
  cropRecommendation: CropRecommendation,
  farmer: FarmerData,
  fertilizer: Fertilizer | null
): number => {
  if (!fertilizer) return 0;
  
  // Find the specific crop data
  const crop = farmer.crops?.find(c => c.crop_name === cropRecommendation.cropName);
  if (!crop) return 0;
  
  // Calculate total deficiency per hectare
  let totalDeficiencyPerHectare = 0;
  
  // Add nitrogen deficiency per hectare
  if (cropRecommendation.nitrogenDeficiency > 0) {
    totalDeficiencyPerHectare += cropRecommendation.nitrogenDeficiency / cropRecommendation.fieldSize;
  }
  
  // Add phosphorus deficiency per hectare
  if (cropRecommendation.phosphorusDeficiency > 0) {
    totalDeficiencyPerHectare += cropRecommendation.phosphorusDeficiency / cropRecommendation.fieldSize;
  }
  
  // Add carbon deficiency per hectare
  if (cropRecommendation.carbonDeficiency > 0) {
    totalDeficiencyPerHectare += cropRecommendation.carbonDeficiency / cropRecommendation.fieldSize;
  }
  
  // Add lime deficiency per hectare if available
  if (cropRecommendation.limeDeficiency && cropRecommendation.limeDeficiency > 0) {
    totalDeficiencyPerHectare += cropRecommendation.limeDeficiency / cropRecommendation.fieldSize;
  }
  
  // Calculate quality score
  // Start at 100%, subtract 0.75% for each 1 of deficiency
  const qualityScore = Math.max(0, 100 - (totalDeficiencyPerHectare * 0.75));
  
  return parseFloat(qualityScore.toFixed(1));
}; 