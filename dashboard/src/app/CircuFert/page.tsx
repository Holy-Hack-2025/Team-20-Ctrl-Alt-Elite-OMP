'use client';

import { useState, useEffect } from "react";
import FertilizerCard from "@/components/FertilizerCard";
import Sidebar from "@/components/Sidebar";
import { Fertilizer, FertilizerCompany } from '@/types/agricultural';
import fertilizerData from '../../data/fertilizer_data.json';
import agriculturalData from '../../data/agricultural_data.json';

// Define types for our fertilizer data
type FertilizerComponent = {
  name: string;
  percentage: number;
};

export default function PredictionDashboard() {
  // State for fertilizers and active fertilizer
  const [fertilizers, setFertilizers] = useState<Fertilizer[]>([]);
  const [companies, setCompanies] = useState<FertilizerCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load fertilizer and company data
  useEffect(() => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Set fertilizer data directly from import
      setFertilizers(fertilizerData.fertilizers);

      // Process companies data
      const processedCompanies = agriculturalData.fertilizer_companies.map((company: any) => ({
        ...company,
        waste_allocation_percentage: 100 / agriculturalData.fertilizer_companies.length,
        monthly_capacity_kg: company.customers.length * 5000
      }));
      
      setCompanies(processedCompanies);
      // Set first company as default selection
      if (processedCompanies.length > 0) {
        setSelectedCompany(processedCompanies[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Format large numbers with commas
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Get selected company data
  const selectedCompanyData = companies.find(company => company.id === selectedCompany) || {
    id: '',
    name: '',
    location: '',
    customers: [],
    waste_allocation_percentage: 0,
    monthly_capacity_kg: 0,
    cost_per_kg_eur: 0,
    max_food_waste_percentage: 0
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
              <label className="text-sm font-medium text-gray-600" htmlFor="companySelect">
                Select Company:
              </label>
              <select
                id="companySelect"
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="bg-white border border-gray-200 rounded-md text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
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
          {!isLoading && !error && selectedCompanyData && (
            <>
              {/* Company Allocation Overview */}
              <div className="bg-white rounded-lg shadow overflow-hidden mb-10">
                <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-blue-50">
                  <h2 className="text-xl font-bold text-gray-800">Company Allocation Overview</h2>
                  <p className="text-sm text-gray-600 mt-1">Current waste allocation and capacity utilization for {selectedCompanyData.name}</p>
                </div>
                
                <div className="p-5">
                  <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-md font-semibold text-gray-700 mb-3">Waste Allocation</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Current Allocation</span>
                        <span className="text-lg font-bold text-blue-600">{(selectedCompanyData.waste_allocation_percentage || 0).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Monthly Capacity</span>
                        <span className="text-lg font-bold text-green-600">{formatNumber(selectedCompanyData.monthly_capacity_kg || 0)} kg</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-md font-semibold text-gray-700 mb-3">Processing Status</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Current Load</span>
                        <span className="text-lg font-bold text-yellow-600">{formatNumber(selectedCompanyData.monthly_capacity_kg * 0.8)} kg</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Utilization Rate</span>
                        <span className="text-lg font-bold text-purple-600">80%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-md font-semibold text-gray-700 mb-3">Quality Metrics</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Max Waste %</span>
                        <span className="text-lg font-bold text-indigo-600">{selectedCompanyData.max_food_waste_percentage || 40}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Cost per kg</span>
                        <span className="text-lg font-bold text-red-600">€{selectedCompanyData.cost_per_kg_eur?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
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
              
              {/* Recommendations */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-800">Allocation Recommendations</h2>
                </div>
                <div className="p-5 space-y-4">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-green-800">Increase Allocation</span>
                      <span className="text-xs px-2 py-0.5 bg-green-100 rounded text-green-700">+5%</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Consider increasing waste allocation to meet growing demand.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-blue-800">Capacity Optimization</span>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 rounded text-blue-700">Available</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Current capacity utilization is optimal for current demand.
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