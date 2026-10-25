import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code2,
  Bug,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Terminal
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { api } from '../lib/api';
import { Bug as IBug } from '../types';

export const DeveloperWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const [assignedBugs, setAssignedBugs] = useState<IBug[]>([]);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const loadData = async () => {
    const allBugs = await api.getBugs();
    // Show bugs assigned to developer usr-102 or open
    setAssignedBugs(allBugs.filter((b) => b.assignee_id === 'usr-102' || b.status === 'In Progress' || b.status === 'Open'));
  };

  useEffect(() => {
    loadData();
    const unsub = api.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, []);

  const handleMarkFixed = async (e: React.MouseEvent, bugId: string) => {
    e.stopPropagation();
    setIsUpdating(bugId);
    try {
      await api.updateBugStatus(bugId, 'Fixed', 'usr-102');
      await loadData();
    } finally {
      setIsUpdating(null);
    }
  };

  const criticalAssigned = assignedBugs.filter((b) => b.severity === 'Critical' && b.status !== 'Closed').length;
  const inProgressAssigned = assignedBugs.filter((b) => b.status === 'In Progress').length;
  const fixedCount = assignedBugs.filter((b) => b.status === 'Fixed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary-light text-primary">
              <Code2 size={18} />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-navy-900">
              Developer Workspace
            </h1>
          </div>
          <p className="text-xs text-secondary mt-1">
            Defect remediation queue, stack traces, and verification hand-off.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/bugs')}
          >
            All Defects
          </Button>
        </div>
      </div>

      {/* Developer Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Assigned Defects"
          value={assignedBugs.length}
          subtext="Under active resolution"
          subtextColor="gray"
          icon={<Bug size={18} />}
        />
        <MetricCard
          label="Critical (P1)"
          value={criticalAssigned}
          subtext="Blocking release build"
          subtextColor="red"
          icon={<AlertTriangle size={18} />}
        />
        <MetricCard
          label="In Progress"
          value={inProgressAssigned}
          subtext="Branch created"
          subtextColor="gray"
          icon={<Clock size={18} />}
        />
        <MetricCard
          label="Awaiting QA Retest"
          value={fixedCount}
          subtext="Code merged & deployed"
          subtextColor="green"
          icon={<CheckCircle2 size={18} />}
        />
      </div>

      {/* Developer Defect Worklist */}
      <div className="bg-surface rounded-card border border-border p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-navy-900">Assigned Defect Queue</h3>
            <p className="text-xs text-secondary mt-0.5">
              Review reproduction steps, examine logs, and mark resolved for QA verification.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-soft/70 border-b border-border text-secondary uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Bug ID</th>
                <th className="py-3 px-4">Title & Context</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assignedBugs.map((bug) => (
                <tr
                  key={bug.id}
                  onClick={() => navigate(`/bugs/${bug.id}`)}
                  className="hover:bg-soft cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-4 font-semibold text-primary group-hover:underline whitespace-nowrap">
                    {bug.bug_code}
                  </td>
                  <td className="py-3 px-4 max-w-sm">
                    <div className="font-semibold text-navy-900 truncate">{bug.title}</div>
                    <div className="text-[11px] text-muted truncate mt-0.5 flex items-center gap-1.5">
                      <Terminal size={12} /> {bug.category}
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <SeverityBadge severity={bug.severity} size="sm" />
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <StatusBadge status={bug.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-semibold text-navy-800 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                      {bug.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {bug.status !== 'Fixed' && bug.status !== 'Closed' && (
                      <Button
                        size="sm"
                        isLoading={isUpdating === bug.id}
                        onClick={(e) => handleMarkFixed(e, bug.id)}
                        className="text-xs"
                      >
                        <CheckCircle2 size={13} /> Mark Fixed
                      </Button>
                    )}
                    {bug.status === 'Fixed' && (
                      <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                        Ready for Retest
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
