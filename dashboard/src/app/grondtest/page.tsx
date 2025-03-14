'use client';

import { useState } from "react";
import FertilizerCard from "@/components/FertilizerCard";
import Sidebar from "@/components/Sidebar";

// Define types for our fertilizer data
type FertilizerComponent = {
  name: string;
  amount: string;
};

type Fertilizer = {
  id: number;
  title: string;
  totalAmount: string;
  components: FertilizerComponent[];
};

export default function GrondtestDashboard() {
  // Define our fertilizer data
  const fertilizers: Fertilizer[] = [
    {
      id: 1,
      title: "Meststof 1",
      totalAmount: "2.400 kg",
      components: [
        { name: "Koolstof", amount: "1.300 kg" },
        { name: "Fosfor", amount: "980 kg" },
        { name: "Kalium", amount: "350 kg" },
        { name: "Kalk", amount: "200 kg" },
      ]
    },
    {
      id: 2,
      title: "Meststof 2",
      totalAmount: "2.100 kg",
      components: [
        { name: "Koolstof", amount: "1.100 kg" },
        { name: "Fosfor", amount: "850 kg" },
        { name: "Kalium", amount: "400 kg" },
        { name: "Kalk", amount: "180 kg" },
      ]
    },
    {
      id: 3,
      title: "Meststof 3",
      totalAmount: "2.500 kg",
      components: [
        { name: "Koolstof", amount: "1.400 kg" },
        { name: "Fosfor", amount: "1.050 kg" },
        { name: "Kalium", amount: "320 kg" },
        { name: "Kalk", amount: "210 kg" },
      ]
    }
  ];

  // State for tracking which fertilizer is selected
  const [activeFertilizer, setActiveFertilizer] = useState<number>(1);

  // Get the currently active fertilizer data
  const activeFertilizerData = fertilizers.find(f => f.id === activeFertilizer) || fertilizers[0];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-2xl font-semibold text-slate-800">Grondtest Dashboard</h1>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-slate-600">Periode:</span>
              <select className="bg-white border border-slate-200 rounded-md text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                <option>Voorjaar 2024</option>
                <option>Zomer 2024</option>
                <option>Najaar 2024</option>
              </select>
            </div>
          </div>
          
          {/* Fertilizer Cards as Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {fertilizers.map(fertilizer => (
              <FertilizerCard 
                key={fertilizer.id}
                title={fertilizer.title} 
                totalAmount={fertilizer.totalAmount}
                isActive={fertilizer.id === activeFertilizer}
                onClick={() => setActiveFertilizer(fertilizer.id)}
              />
            ))}
          </div>
          
          {/* Selected Fertilizer Details */}
          <div className="bg-white rounded-xl shadow-sm mb-10 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-medium text-slate-800">
                Samenstelling {activeFertilizerData.title}
              </h2>
              <span className="text-sm px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                Totaal: {activeFertilizerData.totalAmount}
              </span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                {activeFertilizerData.components.map((component, index) => (
                  <div key={index} className="flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-600">{component.name}</span>
                      <span className="text-sm font-bold text-slate-900">{component.amount}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ 
                          width: `${(parseInt(component.amount.split(' ')[0]) / parseInt(activeFertilizerData.totalAmount.split(' ')[0])) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-lg font-medium text-slate-800">Bodem Analyse</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-500 mb-1">Kalkstof</span>
                    <span className="text-xl font-semibold text-slate-900">72%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-500 mb-1">Bodem Fosfor</span>
                    <span className="text-xl font-semibold text-slate-900">15 mg/kg</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-500 mb-1">Stikstof</span>
                    <span className="text-xl font-semibold text-slate-900">48 kg/ha</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-500 mb-1">Kali</span>
                    <span className="text-xl font-semibold text-slate-900">23 mg/100g</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-lg font-medium text-slate-800">Aanbevelingen</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-700">Voorjaar bemesting</span>
                    <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors">
                      Bekijken
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-700">Bekalking advies</span>
                    <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors">
                      Bekijken
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-700">Bodemverbeteraar</span>
                    <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors">
                      Bekijken
                    </button>
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