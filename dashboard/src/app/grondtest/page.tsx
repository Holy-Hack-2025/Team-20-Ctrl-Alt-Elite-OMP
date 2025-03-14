'use client';

import { useState, useEffect } from "react";
import FertilizerCard from "@/components/FertilizerCard";
import Sidebar from "@/components/Sidebar";

// Define types for our fertilizer data
type FertilizerComponent = {
  name: string;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  soilTarget: number;
  currentLevel: number;
};

type Fertilizer = {
  id: number;
  title: string;
  baseAmount: number;
  predictedIncrease: string;
  components: FertilizerComponent[];
  targetCrops: string[];
};

export default function PredictionDashboard() {
  // State for fertilizers and active fertilizer
  const [fertilizers, setFertilizers] = useState<Fertilizer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch fertilizer data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/data/fertilizer_data.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setFertilizers(data.fertilizers);
      } catch (error) {
        console.error('Error loading fertilizer data:', error);
        setError('Failed to load fertilizer data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format large numbers with commas
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Helper function to get a Tailwind color based on the role
  const getRoleColor = (role: string): string => {
    switch (role) {
      case "Farmer":
        return "green";
      case "Wholesaler":
        return "blue";
      case "Restaurant":
        return "indigo";
      case "Waste":
        return "yellow";
      case "Compost":
        return "orange";
      case "Fertilizer Company":
        return "red";
      default:
        return "gray";
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="p-6 max-w-screen-xl mx-auto">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
              Fertilizer Prediction Dashboard
            </h1>
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-600" htmlFor="predictionPeriod">
                Prediction Period:
              </label>
              <select
                id="predictionPeriod"
                className="bg-white border border-gray-200 rounded-md text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option>Next 3 months</option>
                <option>Next 6 months</option>
                <option>Next 12 months</option>
              </select>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Content (only show when not loading and no error) */}
          {!isLoading && !error && (
            <>
              {/* Incoming Waste Stream Forecast - moved from below and expanded */}
              <div className="bg-white rounded-lg shadow overflow-hidden mb-10">
                <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-blue-50">
                  <h2 className="text-xl font-bold text-gray-800">Circular Economy Waste Intelligence</h2>
                  <p className="text-sm text-gray-600 mt-1">Real-time waste analytics and forecasting to optimize fertilizer production and strengthen partner collaboration</p>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Current Input Stats */}
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Current Waste Inputs
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="block text-sm text-gray-500 mb-1">Weekly Volume</span>
                        <span className="block text-xl font-bold text-gray-900">2,850 kg</span>
                        <span className="text-xs text-green-600">+12% vs last month</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="block text-sm text-gray-500 mb-1">Source Diversity</span>
                        <span className="block text-xl font-bold text-gray-900">17 partners</span>
                        <span className="text-xs text-blue-600">3 new this month</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="block text-sm text-gray-500 mb-1">Composition</span>
                        <span className="block text-md font-bold text-gray-900">Mixed Organic</span>
                        <span className="text-xs text-gray-600">60% veg, 25% fruit, 15% grain</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="block text-sm text-gray-500 mb-1">Quality Rating</span>
                        <span className="block text-xl font-bold text-gray-900">85%</span>
                        <span className="text-xs text-green-600">High nutrient potential</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Production Planning */}
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Production Planning
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="block text-sm text-gray-500 mb-1">Processing Time</span>
                        <span className="block text-xl font-bold text-gray-900">21 days</span>
                        <span className="text-xs text-gray-600">From waste to product</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="block text-sm text-gray-500 mb-1">Yield Forecast</span>
                        <span className="block text-xl font-bold text-gray-900">2,230 kg</span>
                        <span className="text-xs text-green-600">78% conversion rate</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="block text-sm text-gray-500 mb-1">Capacity Usage</span>
                        <span className="block text-xl font-bold text-gray-900">82%</span>
                        <span className="text-xs text-yellow-600">18% available</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="block text-sm text-gray-500 mb-1">Completion Date</span>
                        <span className="block text-xl font-bold text-gray-900">Nov 15</span>
                        <span className="text-xs text-blue-600">Next batch ready</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Market & Partner Intelligence */}
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Market & Partner Intelligence
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="block text-sm text-gray-500 mb-1">Farmer Demand</span>
                        <span className="block text-xl font-bold text-gray-900">3,450 kg</span>
                        <span className="text-xs text-red-600">+18% from last quarter</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="block text-sm text-gray-500 mb-1">Upcoming Restaurant Waste</span>
                        <div className="flex justify-between items-center">
                          <span className="block text-md font-bold text-gray-900">Seasonal Increase</span>
                          <span className="text-xs px-2 py-1 bg-yellow-100 rounded text-yellow-800">+25% expected</span>
                        </div>
                        <span className="text-xs text-gray-600">Holiday season surge beginning</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="block text-sm text-gray-500 mb-1">Nutrient Requirements</span>
                        <div className="flex text-xs space-x-1 mt-1">
                          <span className="px-2 py-1 bg-blue-100 rounded text-blue-800">Nitrogen: High</span>
                          <span className="px-2 py-1 bg-red-100 rounded text-red-800">Phosphorus: Low</span>
                          <span className="px-2 py-1 bg-green-100 rounded text-green-800">Potassium: Medium</span>
                        </div>
                        <span className="text-xs text-gray-600 mt-1 block">Based on farmer crop planning</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Additional Alert Section for Collaboration */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-10 rounded-r-lg shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1 md:flex md:justify-between">
                    <p className="text-sm text-blue-700">
                      <strong>Collaboration Alert:</strong> 3 farm partners are planning winter wheat planting in December. Coordinate with restaurants for increased collection of nitrogen-rich waste.
                    </p>
                    <p className="mt-3 text-sm md:mt-0 md:ml-6">
                      <a href="#" className="whitespace-nowrap font-medium text-blue-700 hover:text-blue-600">
                        View details <span aria-hidden="true">&rarr;</span>
                      </a>
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Fertilizer Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {fertilizers.map(fertilizer => (
                  <FertilizerCard 
                    key={fertilizer.id}
                    title={fertilizer.title} 
                    totalAmount={`${formatNumber(fertilizer.baseAmount)} kg`}
                    predictedIncrease={fertilizer.predictedIncrease}
                    components={fertilizer.components}
                  />
                ))}
              </div>
              
              {/* Additional Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-5 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">Soil Health Indicators</h2>
                  </div>
                  <div className="p-5 grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-600">pH Levels</h3>
                      <div className="mt-2 flex items-center">
                        <span className="text-2xl font-bold text-gray-900">6.7</span>
                        <span className="ml-2 text-sm text-green-600">Optimal</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-600">Nitrogen</h3>
                      <div className="mt-2 flex items-center">
                        <span className="text-2xl font-bold text-gray-900">45 ppm</span>
                        <span className="ml-2 text-sm text-yellow-600">+5 needed</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-600">Organic Matter</h3>
                      <div className="mt-2 flex items-center">
                        <span className="text-2xl font-bold text-gray-900">3.2%</span>
                        <span className="ml-2 text-sm text-green-600">Good</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* New section to fill the gap where Compost Analysis was */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-5 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">Waste-to-Fertilizer Metrics</h2>
                  </div>
                  <div className="p-5 grid grid-cols-2 gap-5">
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="block text-sm text-gray-500 mb-1">Conversion Efficiency</span>
                      <span className="block text-xl font-bold text-gray-900">78%</span>
                      <span className="text-xs text-green-600">+3% vs target</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="block text-sm text-gray-500 mb-1">Processing Capacity</span>
                      <span className="block text-xl font-bold text-gray-900">3,500 kg/week</span>
                      <span className="text-xs text-blue-600">82% utilized</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Circular Economy Chain */}
              <div className="bg-white rounded-lg shadow p-5 mb-10">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Circular Economy Chain</h2>
                <div className="flex overflow-x-auto space-x-4 items-center">
                  {["Farmer", "Wholesaler", "Restaurant", "Waste", "Compost", "Fertilizer Company", "Farmer"].map((role, idx) => (
                    <div key={idx} className="flex items-center">
                      <div
                        className={`rounded-full px-4 py-2 bg-${getRoleColor(role)}-100 text-${getRoleColor(role)}-700 font-medium whitespace-nowrap`}
                      >
                        {role}
                      </div>
                      {idx < 6 && <span className="mx-2 text-gray-400">→</span>}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Recommendations */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-800">Recommendations</h2>
                </div>
                <div className="p-5 space-y-4">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-green-800">Increase Production</span>
                      <span className="text-xs px-2 py-0.5 bg-green-100 rounded text-green-700">+15%</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Boost fertilizer production to meet evolving demand.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-blue-800">Phosphorus Adjustment</span>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 rounded text-blue-700">Shortage</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Increase phosphorus content by 10% in your mix.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-purple-800">New Partnerships</span>
                      <span className="text-xs px-2 py-0.5 bg-purple-100 rounded text-purple-700">New</span>
                    </div>
                    <p className="text-sm text-purple-700">
                      Explore new collaborations with local restaurants.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
          
        </main>
      </div>
    </div>
  );
} 