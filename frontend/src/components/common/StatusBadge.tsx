import React from 'react';
import { BugStatus } from '../../types';

interface StatusBadgeProps {
  status: BugStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStyles = () => {
    switch (status) {
      case 'Open':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'In Progress':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Fixed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Retest':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Closed':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'Reopened':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium ${getStyles()} ${sizeClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {status}
    </span>
  );
};
