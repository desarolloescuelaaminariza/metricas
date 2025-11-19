import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  colorClass: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subValue, icon: Icon, colorClass }) => {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-lg bg-opacity-10 ${colorClass.replace('text-', 'bg-')}`}>
          <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
        {subValue && (
          <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full font-mono">
            {subValue}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-500 tracking-tight">{title}</h3>
        <div className="text-3xl font-bold text-gray-900 tracking-tighter">{value}</div>
      </div>
    </div>
  );
};

export default MetricCard;
