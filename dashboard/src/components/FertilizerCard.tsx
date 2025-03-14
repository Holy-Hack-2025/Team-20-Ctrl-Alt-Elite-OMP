'use client';

import { useState } from "react";

type Metric = {
  name: string;
  value: string;
  range: [number, number];
};

type FertilizerCardProps = {
  title: string;
  totalAmount: string;
  predictedIncrease: string;
  isActive: boolean;
  onClick: () => void;
};

export default function FertilizerCard({ 
  title, 
  totalAmount, 
  predictedIncrease, 
  isActive, 
  onClick 
}: FertilizerCardProps) {
  return (
    <div 
      className={`rounded-lg p-5 flex flex-col cursor-pointer transition-all ${
        isActive 
          ? 'bg-white border-l-4 border-blue-500 shadow' 
          : 'bg-gray-50 hover:bg-white hover:shadow-sm border-l-4 border-transparent'
      }`}
      onClick={onClick}
    >
      <h2 className="text-lg font-medium text-gray-800 mb-2">{title}</h2>
      
      <div className="flex items-center justify-between mt-1">
        <div>
          <span className="text-sm text-gray-500">Totaal</span>
          <p className="text-xl font-bold text-gray-900">{totalAmount}</p>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-sm text-gray-500 mb-1">Prognose</span>
          <div className={`inline-flex items-center px-2.5 py-1 rounded-md ${
            predictedIncrease.startsWith('+') 
              ? 'bg-green-100 text-green-700' 
              : predictedIncrease.startsWith('-')
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700'
          }`}>
            <span className="font-medium mr-1">{predictedIncrease}</span>
            <span>
              {predictedIncrease.startsWith('+') 
                ? '↑' 
                : predictedIncrease.startsWith('-') 
                  ? '↓' 
                  : '→'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 