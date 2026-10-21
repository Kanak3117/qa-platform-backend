import React from 'react';
import { BugSeverity } from '../../types';

interface SeverityBadgeProps {
  severity: BugSeverity | string;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const getStyles = () => {
    switch (severity) {
      case 'Critical':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200',
          dot: 'bg-red-600',
        };
      case 'High':
        return {
          bg: 'bg-orange-50 text-orange-700 border-orange-200',
          dot: 'bg-orange-600',
        };
      case 'Medium':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-600',
        };
      case 'Low':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-600',
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-500',
        };
    }
  };

  const style = getStyles();
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium ${style.bg} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${style.dot}`}></span>
      {severity}
    </span>
  );
};
