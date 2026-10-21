import React from 'react';

interface MetricCardProps {
  label: string;
  value: number | string;
  subtext?: string;
  subtextColor?: 'green' | 'red' | 'gray' | 'purple';
  icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  subtextColor = 'gray',
  icon,
}) => {
  const getSubtextClass = () => {
    switch (subtextColor) {
      case 'green':
        return 'text-emerald-600';
      case 'red':
        return 'text-rose-600';
      case 'purple':
        return 'text-purple-600';
      default:
        return 'text-secondary';
    }
  };

  return (
    <div className="bg-surface rounded-card border border-border p-5 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-secondary uppercase tracking-wider">{label}</span>
        {icon && <div className="text-muted">{icon}</div>}
      </div>
      <div className="flex items-baseline justify-between mt-1">
        <span className="text-3xl font-bold tracking-tight text-navy-900">{value}</span>
      </div>
      {subtext && (
        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center text-xs">
          <span className={`font-medium ${getSubtextClass()}`}>{subtext}</span>
        </div>
      )}
    </div>
  );
};
