import React from 'react';

interface PriorityBadgeProps {
  priority: string;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'sm' }) => {
  const getBadgeClass = () => {
    const p = (priority || '').toUpperCase();
    if (p.includes('CRITICAL') || p === 'P1') {
      return 'badge-critical';
    }
    if (p.includes('HIGH') || p === 'P2') {
      return 'badge-high';
    }
    if (p.includes('MED') || p === 'P3') {
      return 'badge-medium';
    }
    return 'badge-low';
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center rounded border font-semibold ${getBadgeClass()} ${sizeClasses}`}>
      {priority}
    </span>
  );
};
