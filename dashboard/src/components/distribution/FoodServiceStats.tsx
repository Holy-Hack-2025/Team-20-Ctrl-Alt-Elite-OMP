import React from 'react';

// Types for food service data
type HistoricalData = {
  revenue: number;
  food_waste_kg: number;
  waste_factor: number;
};

type Location = {
  id: string;
  name: string;
  address: string;
  capacity?: string;
  meals_per_day?: number;
  historical_data: {
    [year: string]: {
      [quarter: string]: {
        [month: string]: HistoricalData;
      };
    };
  };
  running_average_waste_factor: number;
  projected_data: {
    [year: string]: {
      [quarter: string]: {
        [month: string]: {
          projected_revenue: number;
          estimated_waste_kg: number;
        };
      };
    };
  };
  locations_included?: Array<{
    name: string;
    address: string;
    daily_meals: number;
  }>;
};

type Establishment = {
  id: string;
  name: string;
  type: string;
  locations: Location[];
};

export type FoodServiceData = {
  food_service_establishments: Establishment[];
};

// Component props
type FoodServiceStatsProps = {
  foodServiceData: FoodServiceData;
  selectedType: string;
  expandedLocations: { [key: string]: boolean };
  toggleLocations: (sourceId: string) => void;
};

// Enhanced location type with establishment info
type EnhancedLocation = Location & {
  establishmentType: string;
  establishmentName: string;
};

const FoodServiceStats: React.FC<FoodServiceStatsProps> = ({
  foodServiceData,
  selectedType,
  expandedLocations,
  toggleLocations
}) => {
  // Flatten locations for display
  const wasteSources: EnhancedLocation[] = foodServiceData.food_service_establishments.flatMap(establishment => 
    establishment.locations.map(location => ({
      ...location,
      establishmentType: establishment.type,
      establishmentName: establishment.name
    }))
  );

  // Calculate totals
  const totalWaste = wasteSources.reduce((sum, source) => {
    const marchData = source.historical_data["2024"]?.["Q1"]?.["March"];
    return sum + (marchData?.food_waste_kg || 0);
  }, 0);

  const totalMeals = wasteSources.reduce((sum, source) => {
    return sum + (source.meals_per_day || 0);
  }, 0);

  const averageWasteFactor = wasteSources.reduce((sum, source) => {
    return sum + source.running_average_waste_factor;
  }, 0) / wasteSources.length;

  // Filter sources based on selected type
  const filteredSources = selectedType === "all" 
    ? wasteSources 
    : wasteSources.filter(source => source.establishmentType === selectedType);

  return (
    <>
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Monthly Food Waste</h3>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-gray-900">{totalWaste.toLocaleString()} kg</span>
            <span className="text-sm text-blue-600 mb-1">From {wasteSources.length} Sources</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Daily Meals Served</h3>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-gray-900">{totalMeals.toLocaleString()}</span>
            <span className="text-sm text-blue-600 mb-1">Across All Facilities</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Average Waste Factor</h3>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-gray-900">{(averageWasteFactor * 100).toFixed(1)}%</span>
            <span className="text-sm text-blue-600 mb-1">of Revenue</span>
          </div>
        </div>
      </div>

      {/* Waste Sources Detail */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-800">Food Waste Sources</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSources.map((source) => {
              const currentData = source.historical_data["2024"]?.["Q1"]?.["March"];
              return (
                <div key={source.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{source.name}</h3>
                      <span className="text-sm text-gray-500">{source.establishmentType}</span>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {source.running_average_waste_factor} Waste Rate
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-gray-600">Location:</span>
                      <span className="ml-2 text-gray-900">{source.address}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Daily Meals:</span>
                      <span className="ml-2 text-gray-900">{source.meals_per_day?.toLocaleString() || 'N/A'}</span>
                    </div>
                    {source.locations_included && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Included Locations</span>
                          <button
                            onClick={() => toggleLocations(source.id)}
                            className="text-sm px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors duration-200 ease-in-out"
                          >
                            {expandedLocations[source.id] ? 'Hide' : 'Show'} Locations • {source.locations_included.length}
                          </button>
                        </div>
                        <div 
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            expandedLocations[source.id] ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                          }`}
                        >
                          <div className="mt-2 space-y-2">
                            {source.locations_included.map((location, index) => (
                              <div 
                                key={index} 
                                className="text-sm bg-white rounded p-2 border border-gray-100 transform transition-all duration-200"
                              >
                                <div className="font-medium text-gray-900">{location.name}</div>
                                <div className="text-gray-600 text-xs">{location.address}</div>
                                <div className="text-gray-600 text-xs mt-1">{location.daily_meals.toLocaleString()} daily meals</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Monthly Waste:</span>
                        <span className="font-medium text-gray-900">{currentData?.food_waste_kg.toLocaleString()} kg</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-800">Key Insights</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">Waste Patterns by Establishment Type</h3>
              <ul className="space-y-2">
                <li className="text-sm text-blue-700">Hospitals generate the highest volume of food waste per location</li>
                <li className="text-sm text-blue-700">Fast food chains maintain the lowest waste factors</li>
                <li className="text-sm text-blue-700">Educational institutions show seasonal variations in waste</li>
              </ul>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-medium text-green-800 mb-2">Optimization Opportunities</h3>
              <ul className="space-y-2">
                <li className="text-sm text-green-700">Implement portion control in facilities with high waste factors</li>
                <li className="text-sm text-green-700">Focus on large-volume generators for maximum impact</li>
                <li className="text-sm text-green-700">Consider seasonal adjustments for educational institutions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FoodServiceStats; 