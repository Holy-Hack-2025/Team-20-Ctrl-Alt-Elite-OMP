'use client';

import { useState } from "react";

type Metric = {
  name: string;
  value: string;
  range: [number, number];
};

type FertilizerComponent = {
  name: string;
  percentage: number;
};

type FertilizerCardProps = {
  title: string;
  totalAmount: string;
  predictedIncrease: string;
  isActive?: boolean;
  onClick?: () => void;
  components?: FertilizerComponent[];
};

export default function FertilizerCard({ 
  title, 
  totalAmount, 
  predictedIncrease, 
  isActive = false, 
  onClick,
  components = []
}: FertilizerCardProps) {
  // State to track which component is being hovered
  const [hoveredComponent, setHoveredComponent] = useState<number | null>(null);
  
  // Calculate total kg for a component
  const calculateAmount = (percentage: number, totalAmount: string): string => {
    const numericAmount = parseInt(totalAmount.replace(/,/g, ''));
    const amount = (percentage / 100) * numericAmount;
    return `${amount.toFixed(0)} kg`;
  };

  return (
    <div 
      className={`rounded-lg p-5 flex flex-col transition-all ${
        isActive 
          ? 'bg-white border-l-4 border-blue-500 shadow' 
          : 'bg-gray-50 hover:bg-white hover:shadow-sm border-l-4 border-transparent'
      }`}
      onClick={onClick}
    >
      <h2 className="text-lg font-medium text-gray-800 mb-2">{title}</h2>
      
      <div className="flex items-center justify-between mt-1 mb-3">
        <div>
          <span className="text-sm text-gray-500">Totaal</span>
          <p className="text-xl font-bold text-gray-900">{totalAmount}</p>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-sm text-gray-500 mb-1">Prognose</span>
          <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-gray-700">
            <span className="font-medium">{predictedIncrease}</span>
          </div>
        </div>
      </div>

      {/* Compact Component Display */}
      {components && components.length > 0 && (
        <div className="mt-1 pt-3 border-t border-gray-200">
          <h3 className="text-xs font-medium text-gray-500 mb-2">Composition</h3>
          <div className="space-y-2">
            {components.map((comp, idx) => (
              <div 
                key={idx} 
                className="relative"
                onMouseEnter={() => setHoveredComponent(idx)}
                onMouseLeave={() => setHoveredComponent(null)}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full mr-1.5 bg-blue-500"></div>
                    <span className="text-gray-700">{comp.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900">{comp.percentage.toFixed(1)}%</span>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${Math.min(comp.percentage, 100)}%` }}
                  ></div>
                </div>
                
                {/* Tooltip for more details - shown on hover */}
                {hoveredComponent === idx && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-2 text-xs">
                    <div>
                      <span className="text-gray-500">Amount:</span>
                      <span className="ml-1 font-medium">{calculateAmount(comp.percentage, totalAmount)}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 