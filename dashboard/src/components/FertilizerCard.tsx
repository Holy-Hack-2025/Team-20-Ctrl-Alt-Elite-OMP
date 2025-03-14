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
  isActive: boolean;
  onClick: () => void;
};

export default function FertilizerCard({ title, totalAmount, isActive, onClick }: FertilizerCardProps) {
  return (
    <div 
      className={`rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
        isActive 
          ? 'bg-gradient-to-b from-blue-50 to-blue-100 border-l-4 border-blue-500 shadow-sm' 
          : 'bg-white hover:bg-slate-50 border-l-4 border-transparent'
      }`}
      onClick={onClick}
    >
      <h2 className="text-lg font-medium text-slate-700 mb-1">{title}</h2>
      <p className="text-2xl font-bold text-slate-900">{totalAmount}</p>
    </div>
  );
} 