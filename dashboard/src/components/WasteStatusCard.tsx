'use client';

import { useState } from "react";

type QualityMetric = {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'poor';
  description: string;
};

type WasteSource = {
  name: string;
  amount: number;
  scheduledDelivery: string;
};

type WasteStatusCardProps = {
  title: string;
  totalWasteAmount: string;
  receivedWasteAmount: string;
  qualityScore: number;
  isActive?: boolean;
  onClick?: () => void;
  qualityMetrics?: QualityMetric[];
  wasteSources?: WasteSource[];
};

export default function WasteStatusCard({ 
  title, 
  totalWasteAmount, 
  receivedWasteAmount, 
  qualityScore,
  isActive = false, 
  onClick,
  qualityMetrics = [],
  wasteSources = []
}: WasteStatusCardProps) {
  // State to track expanded sections
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  // Toggle section expansion
  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  // Helper function to determine quality score color
  const getQualityColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Helper function to format percentage
  const formatPercentage = (received: string, total: string): string => {
    const receivedNum = parseInt(received.replace(/,/g, ''));
    const totalNum = parseInt(total.replace(/,/g, ''));
    return `${Math.round((receivedNum / totalNum) * 100)}%`;
  };

  return (
    <div 
      className={`rounded-lg p-5 flex flex-col transition-all ${
        isActive 
          ? 'bg-white border-l-4 border-blue-500 shadow-lg' 
          : 'bg-white/80 hover:bg-white hover:shadow-md cursor-pointer'
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-500">Waste Recycling Status</p>
        </div>
        <div className="flex flex-col items-end">
          <span className={`text-2xl font-bold ${getQualityColor(qualityScore)}`}>
            {qualityScore}%
          </span>
          <span className="text-xs text-gray-500">Quality Score</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <span className="text-xs text-gray-500 block">Total Expected</span>
          <span className="text-lg font-semibold">{totalWasteAmount}</span>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <span className="text-xs text-gray-500 block">Received</span>
          <div className="flex items-end justify-between">
            <span className="text-lg font-semibold">{receivedWasteAmount}</span>
            <span className="text-sm text-gray-600">
              {formatPercentage(receivedWasteAmount, totalWasteAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Quality Metrics Section */}
      <div className="mb-3">
        <button 
          className="flex justify-between items-center w-full text-left p-2 bg-gray-50 rounded-lg hover:bg-gray-100"
          onClick={(e) => {
            e.stopPropagation();
            toggleSection('quality');
          }}
        >
          <span className="font-medium">Quality Metrics</span>
          <svg 
            className={`w-5 h-5 transition-transform ${expandedSection === 'quality' ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSection === 'quality' && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-2">
            {qualityMetrics.map((metric, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium">{metric.name}</span>
                  <p className="text-xs text-gray-500">{metric.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${
                    metric.status === 'good' ? 'text-green-600' : 
                    metric.status === 'warning' ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {metric.value} {metric.unit}
                  </span>
                  <span className={`w-3 h-3 rounded-full ${
                    metric.status === 'good' ? 'bg-green-600' : 
                    metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Waste Sources Section */}
      <div>
        <button 
          className="flex justify-between items-center w-full text-left p-2 bg-gray-50 rounded-lg hover:bg-gray-100"
          onClick={(e) => {
            e.stopPropagation();
            toggleSection('sources');
          }}
        >
          <span className="font-medium">Waste Sources</span>
          <svg 
            className={`w-5 h-5 transition-transform ${expandedSection === 'sources' ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSection === 'sources' && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="pb-2">Source</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Delivery</th>
                </tr>
              </thead>
              <tbody>
                {wasteSources.map((source, idx) => (
                  <tr key={idx} className="border-t border-gray-200">
                    <td className="py-2">{source.name}</td>
                    <td className="py-2">{source.amount} kg</td>
                    <td className="py-2">{source.scheduledDelivery}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 