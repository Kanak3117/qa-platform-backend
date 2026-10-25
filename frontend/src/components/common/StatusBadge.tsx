import React from 'react';
import { BugStatus } from '../../types';

interface StatusBadgeProps {
  status: BugStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getBadgeClass = () => {
    switch (status) {
      case 'Open':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800';
      case 'In Progress':
        return 'badge-inprogress';
      case 'Fixed':
      case 'Passed':
      case 'Resolved':
      case 'Active':
        return 'badge-passed';
      case 'Retest':
        return 'badge-retest';
      case 'Closed':
        return 'badge-closed';
      case 'Reopened':
      case 'Failed':
      case 'Blocked':
        return 'badge-failed';
      default:
        return 'badge-low';
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium ${getBadgeClass()} ${sizeClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {status}
    </span>
  );
};
