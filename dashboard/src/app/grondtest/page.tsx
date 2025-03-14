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
  const [activeFertilizer, setActiveFertilizer] = useState<number>(1);
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

  // Get the currently active fertilizer data
  const activeFertilizerData = fertilizers.find(f => f.id === activeFertilizer) || fertilizers[0];

  // Calculate amount in kg based on percentage and total amount
  const calculateAmount = (percentage: number, totalAmount: number): string => {
    const amount = (percentage / 100) * totalAmount;
    return `${amount.toFixed(0)} kg`;
  };

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
              {/* Fertilizer Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {fertilizers.map(fertilizer => (
                  <FertilizerCard 
                    key={fertilizer.id}
                    title={fertilizer.title} 
                    totalAmount={`${formatNumber(fertilizer.baseAmount)} kg`}
                    predictedIncrease={fertilizer.predictedIncrease}
                    isActive={fertilizer.id === activeFertilizer}
                    onClick={() => setActiveFertilizer(fertilizer.id)}
                  />
                ))}
              </div>
              
              {/* Fertilizer Composition */}
              {activeFertilizerData && (
                <div className="bg-white rounded-lg shadow overflow-hidden mb-10">
                  <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center">
                    <h2 className="text-xl font-semibold text-gray-800">
                      Fertilizer Composition: {activeFertilizerData.title}
                    </h2>
                    <div className="flex items-center gap-3 mt-3 md:mt-0">
                      <span className="text-sm px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                        Total: {formatNumber(activeFertilizerData.baseAmount)} kg
                      </span>
                      <span className="text-sm px-3 py-1 bg-green-50 text-green-700 rounded-full font-medium">
                        Growth: {activeFertilizerData.predictedIncrease}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {activeFertilizerData.components.map((component, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 hover:shadow transition">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-700">{component.name}</span>
                            <div className="flex items-center">
                              <span className="font-bold text-gray-900 mr-2">
                                {calculateAmount(component.percentage, activeFertilizerData.baseAmount)}
                              </span>
                              {component.trend === "up" && <span className="text-green-500">↑</span>}
                              {component.trend === "down" && <span className="text-red-500">↓</span>}
                              {component.trend === "stable" && <span className="text-gray-500">→</span>}
                            </div>
                          </div>
                          <div className="pt-1 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-gray-600">
                                {component.percentage.toFixed(1)}%
                              </span>
                              <span className="text-xs font-medium text-gray-600">
                                Target: {component.soilTarget} ppm
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Additional Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-5 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">Compost Analysis</h2>
                  </div>
                  <div className="p-5 grid grid-cols-2 gap-5">
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="block text-sm text-gray-500 mb-1">Food Service Waste</span>
                      <span className="block text-xl font-bold text-gray-900">2,850 kg/week</span>
                      <span className="text-xs text-green-600">+12% vs last month</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="block text-sm text-gray-500 mb-1">Average Quality</span>
                      <span className="block text-xl font-bold text-gray-900">85%</span>
                      <span className="text-xs text-green-600">High</span>
                    </div>
                  </div>
                </div>
                
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