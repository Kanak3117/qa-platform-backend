import React, { useState, useEffect } from 'react';
import { Download, ShieldCheck, Bug, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/common/Button';
import { MetricCard } from '../components/common/MetricCard';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Bug as IBug, TestExecution, TestCase } from '../types';

export const Reports: React.FC = () => {
  const { currentProject } = useAuth();
  const [bugs, setBugs] = useState<IBug[]>([]);
  const [executions, setExecutions] = useState<TestExecution[]>([]);
  const [cases, setCases] = useState<TestCase[]>([]);

  const loadData = () => {
    Promise.all([
      api.getBugs(currentProject?.id),
      api.getExecutions(undefined, currentProject?.id),
      api.getTestCases(undefined, currentProject?.id)
    ]).then(([b, e, c]) => {
      setBugs(b);
      setExecutions(e);
      setCases(c);
    });
  };

  useEffect(() => {
    loadData();
    const unsub = api.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, [currentProject?.id]);

  const passedCount = executions.filter((e) => e.result === 'Passed').length;
  const totalExecs = executions.length || 1;

  const criticalCount = bugs.filter((b) => b.severity === 'Critical').length;
  const highCount = bugs.filter((b) => b.severity === 'High').length;
  const mediumCount = bugs.filter((b) => b.severity === 'Medium').length;
  const lowCount = bugs.filter((b) => b.severity === 'Low').length;

  const openCount = bugs.filter((b) => b.status === 'Open').length;
  const inProgressCount = bugs.filter((b) => b.status === 'In Progress').length;
  const retestCount = bugs.filter((b) => b.status === 'Retest').length;
  const closedCount = bugs.filter((b) => b.status === 'Closed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-navy-900">QA Reports & Quality Metrics</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary-light text-primary border border-primary/20">
              {currentProject?.name || 'Active Project'}
            </span>
          </div>
          <p className="text-xs text-secondary mt-1">
            Audit test coverage health, defect density, and sprint readiness metrics for {currentProject?.name}.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.print()}
          className="print:hidden"
        >
          <Download size={14} /> Export Quality Report
        </Button>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Pass Rate"
          value={`${Math.round((passedCount / totalExecs) * 100)}%`}
          subtext={`${passedCount} of ${executions.length} passed`}
          subtextColor="green"
          icon={<CheckCircle2 size={18} />}
        />
        <MetricCard
          label="Total Test Cases"
          value={cases.length}
          subtext="Active in repository"
          subtextColor="gray"
          icon={<ShieldCheck size={18} />}
        />
        <MetricCard
          label="Total Logged Defects"
          value={bugs.length}
          subtext={`${criticalCount} Critical P1`}
          subtextColor="red"
          icon={<Bug size={18} />}
        />
        <MetricCard
          label="Resolved / Closed"
          value={closedCount}
          subtext={`${retestCount} awaiting verification`}
          subtextColor="purple"
          icon={<CheckCircle2 size={18} />}
        />
      </div>

      {/* 2-Column Quality Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <div className="bg-surface rounded-card border border-border p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-navy-900 pb-3 border-b border-border">
            Defect Distribution by Severity
          </h3>
          <div className="space-y-3.5 mt-4 text-xs">
            <div>
              <div className="flex justify-between font-medium mb-1">
                <span className="text-red-600 font-semibold">Critical ({criticalCount})</span>
                <span className="text-secondary">{Math.round((criticalCount / (bugs.length || 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-track h-2 rounded-full overflow-hidden">
                <div style={{ width: `${(criticalCount / (bugs.length || 1)) * 100}%` }} className="bg-red-600 h-2"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-medium mb-1">
                <span className="text-orange-600 font-semibold">High ({highCount})</span>
                <span className="text-secondary">{Math.round((highCount / (bugs.length || 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-track h-2 rounded-full overflow-hidden">
                <div style={{ width: `${(highCount / (bugs.length || 1)) * 100}%` }} className="bg-orange-500 h-2"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-medium mb-1">
                <span className="text-amber-600 font-semibold">Medium ({mediumCount})</span>
                <span className="text-secondary">{Math.round((mediumCount / (bugs.length || 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-track h-2 rounded-full overflow-hidden">
                <div style={{ width: `${(mediumCount / (bugs.length || 1)) * 100}%` }} className="bg-amber-400 h-2"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-medium mb-1">
                <span className="text-emerald-600 font-semibold">Low ({lowCount})</span>
                <span className="text-secondary">{Math.round((lowCount / (bugs.length || 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-track h-2 rounded-full overflow-hidden">
                <div style={{ width: `${(lowCount / (bugs.length || 1)) * 100}%` }} className="bg-emerald-500 h-2"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Lifecycle Distribution */}
        <div className="bg-surface rounded-card border border-border p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-navy-900 pb-3 border-b border-border">
            Defect Lifecycle Progression
          </h3>
          <div className="space-y-3.5 mt-4 text-xs">
            <div>
              <div className="flex justify-between font-medium mb-1">
                <span className="text-blue-700 font-semibold">Open / Triage ({openCount})</span>
                <span className="text-secondary">{Math.round((openCount / (bugs.length || 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-track h-2 rounded-full overflow-hidden">
                <div style={{ width: `${(openCount / (bugs.length || 1)) * 100}%` }} className="bg-blue-500 h-2"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-medium mb-1">
                <span className="text-amber-700 font-semibold">In Progress ({inProgressCount})</span>
                <span className="text-secondary">{Math.round((inProgressCount / (bugs.length || 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-track h-2 rounded-full overflow-hidden">
                <div style={{ width: `${(inProgressCount / (bugs.length || 1)) * 100}%` }} className="bg-amber-500 h-2"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-medium mb-1">
                <span className="text-purple-700 font-semibold">Retest ({retestCount})</span>
                <span className="text-secondary">{Math.round((retestCount / (bugs.length || 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-track h-2 rounded-full overflow-hidden">
                <div style={{ width: `${(retestCount / (bugs.length || 1)) * 100}%` }} className="bg-purple-600 h-2"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-medium mb-1">
                <span className="text-emerald-700 font-semibold">Closed ({closedCount})</span>
                <span className="text-secondary">{Math.round((closedCount / (bugs.length || 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-track h-2 rounded-full overflow-hidden">
                <div style={{ width: `${(closedCount / (bugs.length || 1)) * 100}%` }} className="bg-emerald-600 h-2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
