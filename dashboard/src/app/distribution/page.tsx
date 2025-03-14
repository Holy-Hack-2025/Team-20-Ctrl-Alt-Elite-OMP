'use client';

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import FertilizerCard from "@/components/FertilizerCard";
import WasteStatusCard from "@/components/WasteStatusCard";
import foodServiceData from "../../data/food_service_data.json";
import agriculturalData from '../../data/agricultural_data.json';

// Types for our data
type HistoricalData = {
  revenue: number;
  food_waste_kg: number;
  waste_factor: number;
  nitrogen_level_percentage: number;
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

type FoodServiceData = {
  food_service_establishments: Establishment[];
};

// Add new types for fertilizer companies
type FarmerData = {
  id: string;
  name: string;
  farm_name: string;
  location: {
    city: string;
    region: string;
  };
  total_farm_size_hectares: number;
};

type FertilizerCompany = {
  id: string;
  name: string;
  location: string;
  customers: FarmerData[];
  waste_allocation_percentage?: number;
  monthly_capacity_kg?: number;
};

// Adding WasteStatusCard-related types
type QualityMetric = {
  name: string;
  value: number;
  unit: string;
  status: string;
  description: string;
};

type WasteSource = {
  name: string;
  amount: number;
  scheduledDelivery: string;
  lastDelivery?: string;
  nextDelivery?: string;
  qualityScore?: number;
};

type WasteStatus = {
  total_waste_expected_kg: number;
  total_waste_received_kg: number;
  overall_quality_score: number;
  quality_metrics: {
    name: string;
    value: number;
    unit: string;
    status: string;
    description: string;
  }[];
  waste_sources: WasteSource[];
  monthly_processing_capacity_kg: number;
  production_yield_percentage: number;
  composting_process: {
    active_batches: number;
    average_processing_time_days: number;
    temperature_range_celsius: number[];
    current_efficiency_percentage: number;
  };
};

export default function DistributionDashboard() {
  // Get current month and previous month for comparisons
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    .toLocaleString('default', { month: 'long' });

  // Get data from imported JSON
  const establishments = (foodServiceData as FoodServiceData).food_service_establishments;

  const [selectedType, setSelectedType] = useState<string>("all");
  const [expandedLocations, setExpandedLocations] = useState<{ [key: string]: boolean }>({});

  // Add state for waste allocation view
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  // Add this state for waste status section
  const [activeWasteCard, setActiveWasteCard] = useState<string | null>(null);
  
  // Replace the wasteStatus extraction with code to build it from foodServiceData
  // Create computed waste status from food service data instead of using waste_data.json
  const wasteStatus = calculateWasteStatus(establishments);

  // Get fertilizer companies data
  const fertilizer_companies: FertilizerCompany[] = agriculturalData.fertilizer_companies.map(company => {
    // Calculate total farm area for this company's customers
    const totalFarmArea = company.customers.reduce(
      (sum, farmer) => sum + farmer.total_farm_size_hectares,
      0
    );
    
    // Assume each hectare needs about 50kg of fertilizer per month
    const monthlyCapacity = totalFarmArea * 50;

    return {
      ...company,
      // Add default waste allocation based on total farm area proportion
      waste_allocation_percentage: Math.round((totalFarmArea / agriculturalData.fertilizer_companies.reduce(
        (total, c) => total + c.customers.reduce((sum, f) => sum + f.total_farm_size_hectares, 0),
        0
      )) * 100),
      monthly_capacity_kg: monthlyCapacity
    };
  });

  // Toggle location visibility
  const toggleLocations = (sourceId: string) => {
    setExpandedLocations(prev => ({
      ...prev,
      [sourceId]: !prev[sourceId]
    }));
  };

  // Flatten locations for display
  const wasteSources = establishments.flatMap(establishment => 
    establishment.locations.map(location => ({
      ...location,
      establishmentType: establishment.type,
      establishmentName: establishment.name
    }))
  );

  // Calculate totals and averages
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

  const averageNitrogenLevel = wasteSources.reduce((sum, source) => {
    const marchData = source.historical_data["2024"]?.["Q1"]?.["March"];
    return sum + (marchData?.nitrogen_level_percentage || 0);
  }, 0) / wasteSources.length;

  // Get unique establishment types
  const establishmentTypes = ["all", ...new Set(wasteSources.map(source => source.establishmentType))];

  // Filter sources based on selected type
  const filteredSources = selectedType === "all" 
    ? wasteSources 
    : wasteSources.filter(source => source.establishmentType === selectedType);

  // Calculate waste status from food service data
  function calculateWasteStatus(establishments: Establishment[]): WasteStatus {
    // Get all locations from all establishments
    const allLocations = establishments.flatMap(est => est.locations);
    
    // Extract March 2024 data (current month)
    const currentMonthData = allLocations.map(location => {
      return {
        name: location.name,
        establishmentName: establishments.find(est => 
          est.locations.some(loc => loc.id === location.id)
        )?.name || '',
        establishmentType: establishments.find(est => 
          est.locations.some(loc => loc.id === location.id)
        )?.type || '',
        marchData: location.historical_data["2024"]?.["Q1"]?.["March"] || null,
        aprilProjection: location.projected_data["2024"]?.["Q2"]?.["April"] || null,
        mayProjection: location.projected_data["2024"]?.["Q2"]?.["May"] || null,
        juneProjection: location.projected_data["2024"]?.["Q2"]?.["June"] || null,
        waste_factor: location.running_average_waste_factor
      };
    }).filter(loc => loc.marchData !== null);
    
    // Calculate total waste received in March 2024
    const totalWasteReceived = currentMonthData.reduce(
      (sum, location) => sum + (location.marchData?.food_waste_kg || 0), 
      0
    );
    
    // Calculate projected waste for next month (April 2024)
    const totalWasteExpected = currentMonthData.reduce(
      (sum, location) => sum + (location.aprilProjection?.estimated_waste_kg || 0), 
      0
    );
    
    // Calculate average nitrogen level as our quality metric
    const avgNitrogenLevel = currentMonthData.reduce(
      (sum, location) => sum + (location.marchData?.nitrogen_level_percentage || 0), 
      0
    ) / currentMonthData.length;
    
    // Convert to a 0-100 quality score (assuming 4% nitrogen is excellent quality)
    const qualityScore = Math.min(Math.round((avgNitrogenLevel / 4) * 100), 100);
    
    // Generate quality metrics based on available data
    const qualityMetrics = [
      {
        name: "Nitrogen Content",
        value: avgNitrogenLevel,
        unit: "%",
        status: avgNitrogenLevel > 3 ? "good" : avgNitrogenLevel > 2.5 ? "warning" : "poor",
        description: "Nitrogen available for composting"
      },
      {
        name: "Average Waste Factor",
        value: averageWasteFactor * 100,
        unit: "%",
        status: averageWasteFactor < 0.005 ? "good" : averageWasteFactor < 0.01 ? "warning" : "poor",
        description: "Proportion of food wasted (lower is better)"
      },
      {
        name: "Consistency",
        value: 87.5,
        unit: "%",
        status: "good",
        description: "Uniformity of waste composition"
      },
      {
        name: "Contamination",
        value: 2.8,
        unit: "%",
        status: "warning",
        description: "Non-compostable materials"
      }
    ];
    
    // Generate waste sources from the food service establishments
    const wasteSources = currentMonthData
      .sort((a, b) => (b.marchData?.food_waste_kg || 0) - (a.marchData?.food_waste_kg || 0))
      .slice(0, 5) // Take top 5 waste producers
      .map(location => {
        // Calculate a pseudo quality score based on nitrogen level
        const nitrogenLevel = location.marchData?.nitrogen_level_percentage || 0;
        const qualityScore = Math.min(Math.round((nitrogenLevel / 4) * 100), 100);
        
        // Determine delivery schedule based on establishment type
        let scheduledDelivery = "Weekly";
        if (location.establishmentType.includes("Hospital") || 
            location.establishmentType.includes("University")) {
          scheduledDelivery = "Bi-weekly";
        } else if (location.establishmentType.includes("Event")) {
          scheduledDelivery = "Monthly";
        }
        
        return {
          name: location.establishmentName,
          amount: location.marchData?.food_waste_kg || 0,
          scheduledDelivery,
          qualityScore
        };
      });
    
    // Monthly processing capacity and other metrics
    // These are estimates based on the total waste and reasonable processing assumptions
    const monthlyProcessingCapacity = Math.round(totalWasteExpected * 1.5); // 50% buffer
    const productionYield = 65; // Assuming 65% of waste becomes usable fertilizer
    
    return {
      total_waste_expected_kg: totalWasteExpected,
      total_waste_received_kg: totalWasteReceived,
      overall_quality_score: qualityScore,
      quality_metrics: qualityMetrics,
      waste_sources: wasteSources,
      monthly_processing_capacity_kg: monthlyProcessingCapacity,
      production_yield_percentage: productionYield,
      composting_process: {
        active_batches: 4,
        average_processing_time_days: 45,
        temperature_range_celsius: [55, 65],
        current_efficiency_percentage: 88
      }
    };
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <main className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Food Waste Sources Dashboard</h1>
              <p className="text-gray-600 mt-1">Monitoring and analyzing food waste from various establishments</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-600">Filter by Type:</span>
              <select 
                className="bg-white border border-gray-200 rounded-md text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                {establishmentTypes.map(type => (
                  <option key={type} value={type}>
                    {type === "all" ? "All Types" : type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Overall Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                <span className="text-2xl font-bold text-gray-900">{averageWasteFactor.toFixed(3)}</span>
                <span className="text-sm text-blue-600 mb-1">of Revenue</span>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Average Nitrogen Level</h3>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-gray-900">{averageNitrogenLevel.toFixed(1)}%</span>
                <span className="text-sm text-blue-600 mb-1">in Food Waste</span>
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
                          {source.running_average_waste_factor.toFixed(3)} Waste Rate
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
                        <div className="pt-2 border-t border-gray-200 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Monthly Waste:</span>
                            <span className="font-medium text-gray-900">{currentData?.food_waste_kg.toLocaleString()} kg</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Nitrogen Level:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {currentData?.nitrogen_level_percentage?.toFixed(1) ?? 'N/A'}
                                {currentData?.nitrogen_level_percentage !== undefined && '%'}
                              </span>
                              {currentData?.nitrogen_level_percentage !== undefined && (
                                <div className={`w-2 h-2 rounded-full ${
                                  currentData.nitrogen_level_percentage > 3 
                                    ? 'bg-red-500' 
                                    : currentData.nitrogen_level_percentage > 2.5 
                                      ? 'bg-yellow-500' 
                                      : 'bg-green-500'
                                }`} />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Add Waste Status Section */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Waste Reception Status</h2>
            <p className="text-gray-600 mb-4">
              Overview of waste reception from restaurants for composting and fertilizer production.
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <WasteStatusCard 
                title="Restaurant Waste Reception"
                totalWasteAmount={`${wasteStatus.total_waste_expected_kg.toLocaleString()} kg`}
                receivedWasteAmount={`${wasteStatus.total_waste_received_kg.toLocaleString()} kg`}
                qualityScore={wasteStatus.overall_quality_score}
                isActive={activeWasteCard === 'restaurant-waste'}
                onClick={() => setActiveWasteCard(activeWasteCard === 'restaurant-waste' ? null : 'restaurant-waste')}
                qualityMetrics={wasteStatus.quality_metrics as any}
                wasteSources={wasteStatus.waste_sources}
              />
              
              <div className="bg-white rounded-lg p-5 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Processing Capacity</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-xs text-gray-500 block">Monthly Capacity</span>
                    <span className="text-lg font-semibold">{wasteStatus.monthly_processing_capacity_kg.toLocaleString()} kg</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-xs text-gray-500 block">Production Yield</span>
                    <span className="text-lg font-semibold">{wasteStatus.production_yield_percentage}%</span>
                  </div>
                </div>
                
                <h4 className="font-medium text-gray-700 mb-2">Current Batches in Process</h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between mb-1">
                    <span>Active Batches:</span>
                    <span className="font-medium">{wasteStatus.composting_process.active_batches}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Avg. Processing Time:</span>
                    <span className="font-medium">{wasteStatus.composting_process.average_processing_time_days} days</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Temperature Range:</span>
                    <span className="font-medium">{wasteStatus.composting_process.temperature_range_celsius[0]}-{wasteStatus.composting_process.temperature_range_celsius[1]}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Efficiency:</span>
                    <span className="font-medium">{wasteStatus.composting_process.current_efficiency_percentage}%</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Food Waste Allocations */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-medium text-gray-800">Food Waste Allocations</h2>
              <p className="text-sm text-gray-600 mt-1">Distribution of food waste to fertilizer companies</p>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Fertilizer Companies Overview */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Fertilizer Companies</h3>
                  <div className="space-y-3">
                    {fertilizer_companies.map((company: FertilizerCompany) => (
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
                                (sum: number, farmer: FarmerData) => sum + farmer.total_farm_size_hectares,
                                0
                              ).toLocaleString()}{' '}
                              ha
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Farmer Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Farmer Distribution</h3>
                  {selectedCompany ? (
                    <div className="space-y-3">
                      {fertilizer_companies
                        .find((c: FertilizerCompany) => c.id === selectedCompany)
                        ?.customers.map((farmer: FarmerData) => (
                          <div key={farmer.id} className="bg-white rounded-lg p-4 border border-gray-200">
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
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Select a fertilizer company to view farmer details
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 