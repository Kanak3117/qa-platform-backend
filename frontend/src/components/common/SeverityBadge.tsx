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
          badgeClass: 'badge-critical',
          dot: 'bg-red-600 dark:bg-red-400',
        };
      case 'High':
        return {
          badgeClass: 'badge-high',
          dot: 'bg-amber-600 dark:bg-amber-400',
        };
      case 'Medium':
        return {
          badgeClass: 'badge-medium',
          dot: 'bg-yellow-600 dark:bg-yellow-400',
        };
      case 'Low':
        return {
          badgeClass: 'badge-low',
          dot: 'bg-gray-500 dark:bg-gray-400',
        };
      default:
        return {
          badgeClass: 'badge-low',
          dot: 'bg-gray-500 dark:bg-gray-400',
        };
    }
  };

  const style = getStyles();
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium ${style.badgeClass} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${style.dot}`}></span>
      {severity}
    </span>
  );
};
