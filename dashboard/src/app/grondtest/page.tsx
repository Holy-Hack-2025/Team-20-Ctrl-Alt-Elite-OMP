'use client';

import { useState } from "react";
import FertilizerCard from "@/components/FertilizerCard";
import Sidebar from "@/components/Sidebar";

// Define types for our fertilizer data
type FertilizerComponent = {
  name: string;
  amount: string;
  trend: 'up' | 'down' | 'stable';
};

type Fertilizer = {
  id: number;
  title: string;
  totalAmount: string;
  predictedIncrease: string;
  components: FertilizerComponent[];
};

export default function PredictionDashboard() {
  // Define our fertilizer prediction data
  const fertilizers: Fertilizer[] = [
    {
      id: 1,
      title: "Meststof 1",
      totalAmount: "2.400 kg",
      predictedIncrease: "+15%",
      components: [
        { name: "Koolstof", amount: "1.300 kg", trend: "up" },
        { name: "Fosfor", amount: "980 kg", trend: "up" },
        { name: "Kalium", amount: "350 kg", trend: "stable" },
        { name: "Kalk", amount: "200 kg", trend: "down" },
      ]
    },
    {
      id: 2,
      title: "Meststof 2",
      totalAmount: "2.100 kg",
      predictedIncrease: "+8%",
      components: [
        { name: "Koolstof", amount: "1.100 kg", trend: "up" },
        { name: "Fosfor", amount: "850 kg", trend: "stable" },
        { name: "Kalium", amount: "400 kg", trend: "up" },
        { name: "Kalk", amount: "180 kg", trend: "down" },
      ]
    },
    {
      id: 3,
      title: "Meststof 3",
      totalAmount: "2.500 kg",
      predictedIncrease: "+12%",
      components: [
        { name: "Koolstof", amount: "1.400 kg", trend: "up" },
        { name: "Fosfor", amount: "1.050 kg", trend: "up" },
        { name: "Kalium", amount: "320 kg", trend: "stable" },
        { name: "Kalk", amount: "210 kg", trend: "down" },
      ]
    }
  ];

  // State for tracking which fertilizer is selected
  const [activeFertilizer, setActiveFertilizer] = useState<number>(1);

  // Get the currently active fertilizer data
  const activeFertilizerData = fertilizers.find(f => f.id === activeFertilizer) || fertilizers[0];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
            <h1 className="text-2xl font-semibold text-gray-800">Voorspelling Meststofbehoefte</h1>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-600">Voorspellingsperiode:</span>
              <select className="bg-white border border-gray-200 rounded-md text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                <option>Komende 3 maanden</option>
                <option>Komende 6 maanden</option>
                <option>Komende 12 maanden</option>
              </select>
            </div>
          </div>
          
          {/* Circular Economy Chain - Simplified */}
          <div className="bg-white rounded-lg shadow-sm mb-6 p-5">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Circulaire Keten</h2>
            <div className="flex overflow-x-auto py-2 gap-1">
              <div className="flex items-center">
                <div className="rounded-full bg-green-100 p-3 flex items-center justify-center">
                  <span className="text-green-700 font-medium whitespace-nowrap">Landbouwer</span>
                </div>
                <div className="mx-2 text-gray-400">→</div>
              </div>
              
              <div className="flex items-center">
                <div className="rounded-full bg-blue-100 p-3 flex items-center justify-center">
                  <span className="text-blue-700 font-medium whitespace-nowrap">Groothandel</span>
                </div>
                <div className="mx-2 text-gray-400">→</div>
              </div>
              
              <div className="flex items-center">
                <div className="rounded-full bg-indigo-100 p-3 flex items-center justify-center">
                  <span className="text-indigo-700 font-medium whitespace-nowrap">Restaurant</span>
                </div>
                <div className="mx-2 text-gray-400">→</div>
              </div>
              
              <div className="flex items-center">
                <div className="rounded-full bg-yellow-100 p-3 flex items-center justify-center">
                  <span className="text-yellow-700 font-medium whitespace-nowrap">Afval</span>
                </div>
                <div className="mx-2 text-gray-400">→</div>
              </div>
              
              <div className="flex items-center">
                <div className="rounded-full bg-orange-100 p-3 flex items-center justify-center">
                  <span className="text-orange-700 font-medium whitespace-nowrap">Compost</span>
                </div>
                <div className="mx-2 text-gray-400">→</div>
              </div>
              
              <div className="flex items-center">
                <div className="rounded-full bg-red-100 p-3 flex items-center justify-center border-2 border-red-200">
                  <span className="text-red-700 font-medium whitespace-nowrap">Mestbedrijf</span>
                </div>
                <div className="mx-2 text-gray-400">→</div>
              </div>
              
              <div className="flex items-center">
                <div className="rounded-full bg-green-100 p-3 flex items-center justify-center">
                  <span className="text-green-700 font-medium whitespace-nowrap">Landbouwer</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Fertilizer Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {fertilizers.map(fertilizer => (
              <FertilizerCard 
                key={fertilizer.id}
                title={fertilizer.title} 
                totalAmount={fertilizer.totalAmount}
                predictedIncrease={fertilizer.predictedIncrease}
                isActive={fertilizer.id === activeFertilizer}
                onClick={() => setActiveFertilizer(fertilizer.id)}
              />
            ))}
          </div>
          
          {/* Selected Fertilizer Details */}
          <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
              <h2 className="text-lg font-medium text-gray-800">
                Samenstelling {activeFertilizerData.title}
              </h2>
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-sm px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                  Totaal: {activeFertilizerData.totalAmount}
                </span>
                <span className="text-sm px-3 py-1 bg-green-50 text-green-700 rounded-full font-medium">
                  Verwachte groei: {activeFertilizerData.predictedIncrease}
                </span>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {activeFertilizerData.components.map((component, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-700">{component.name}</span>
                      <div className="flex items-center">
                        <span className="font-bold text-gray-900 mr-2">{component.amount}</span>
                        {component.trend === "up" && (
                          <span className="text-green-500">↑</span>
                        )}
                        {component.trend === "down" && (
                          <span className="text-red-500">↓</span>
                        )}
                        {component.trend === "stable" && (
                          <span className="text-gray-500">→</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Simplified trend indicator */}
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <div className={`flex items-center rounded-md px-2 py-1 ${
                        component.trend === 'up' 
                          ? 'bg-green-50 text-green-700' 
                          : component.trend === 'down' 
                            ? 'bg-red-50 text-red-700' 
                            : 'bg-gray-100 text-gray-600'
                      }`}>
                        <span className="text-xs font-medium mr-1">
                          {component.trend === 'up' 
                            ? 'Stijgende trend' 
                            : component.trend === 'down' 
                              ? 'Dalende trend' 
                              : 'Stabiele trend'}
                        </span>
                        <span className="text-sm">
                          {component.trend === 'up' 
                            ? '↑' 
                            : component.trend === 'down' 
                              ? '↓' 
                              : '→'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Simplified Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Compost Analysis */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-lg font-medium text-gray-800">Compost Analyse</h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="block text-sm text-gray-500 mb-1">Restaurant Afval</span>
                    <span className="block text-lg font-semibold text-gray-900">1.200 kg/week</span>
                    <span className="text-xs text-green-600">+8% tov vorige maand</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="block text-sm text-gray-500 mb-1">Kwaliteit</span>
                    <span className="block text-lg font-semibold text-gray-900">72% (Hoog)</span>
                    <span className="text-xs text-green-600">+5% tov vorige batch</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="block text-sm text-gray-500 mb-1">Fosfor</span>
                    <span className="block text-lg font-semibold text-gray-900">15 mg/kg</span>
                    <span className="text-xs text-red-600">Laag (-3%)</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="block text-sm text-gray-500 mb-1">Kali</span>
                    <span className="block text-lg font-semibold text-gray-900">23 mg/100g</span>
                    <span className="text-xs text-gray-600">Normaal (±0%)</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recommendations */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-lg font-medium text-gray-800">Aanbevelingen</h2>
              </div>
              <div className="p-5">
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex justify-between mb-1 items-center">
                      <span className="font-medium text-green-800">Meststof 1 Productie</span>
                      <span className="text-xs px-2 py-0.5 bg-green-100 rounded text-green-700">+15%</span>
                    </div>
                    <p className="text-sm text-green-700 mb-2">Verhoog productie om te voldoen aan verwachte vraagstijging.</p>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex justify-between mb-1 items-center">
                      <span className="font-medium text-blue-800">Fosfor Toevoeging</span>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 rounded text-blue-700">Tekort</span>
                    </div>
                    <p className="text-sm text-blue-700 mb-2">Verhoog fosfor met 10% vanwege lager gehalte in compost.</p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex justify-between mb-1 items-center">
                      <span className="font-medium text-purple-800">Restaurant Partners</span>
                      <span className="text-xs px-2 py-0.5 bg-purple-100 rounded text-purple-700">Nieuw</span>
                    </div>
                    <p className="text-sm text-purple-700 mb-2">3 nieuwe restaurants beschikbaar voor circulaire samenwerking.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 