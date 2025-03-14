'use client';

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
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