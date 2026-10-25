import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Sparkles, ArrowRight, AlertCircle, Info } from 'lucide-react';
import { Button } from '../components/common/Button';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { CreateBugModal } from '../components/bugs/CreateBugModal';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Bug, TestExecution } from '../types';
import { MOCK_USERS } from '../lib/mockData';

export const Overview: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject } = useAuth();
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [executions, setExecutions] = useState<TestExecution[]>([]);
  const [isLogBugOpen, setIsLogBugOpen] = useState(false);

  const loadData = async () => {
    try {
      const [fetchedBugs, fetchedExecutions] = await Promise.all([
        api.getBugs(currentProject?.id),
        api.getExecutions(undefined, currentProject?.id),
      ]);
      setBugs(fetchedBugs);
      setExecutions(fetchedExecutions);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadData();
    const unsub = api.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, [currentProject?.id]);

  // Compute metrics dynamically from current state
  const openCount = bugs.filter((b) => b.status === 'Open').length;
  const inProgressCount = bugs.filter((b) => b.status === 'In Progress').length;
  const retestCount = bugs.filter((b) => b.status === 'Retest').length;
  const closedCount = bugs.filter((b) => b.status === 'Closed').length;

  const totalExecutions = executions.length || 1;
  const passedCount = executions.filter((e) => e.result === 'Passed').length;
  const failedCount = executions.filter((e) => e.result === 'Failed').length;
  const blockedCount = executions.filter((e) => e.result === 'Blocked').length;

  const passedPct = Math.round((passedCount / totalExecutions) * 100);
  const failedPct = Math.round((failedCount / totalExecutions) * 100);
  const blockedPct = 100 - passedPct - failedPct;

  // Severity metrics for open bugs
  const activeBugs = bugs.filter((b) => b.status !== 'Closed');
  const criticalCount = activeBugs.filter((b) => b.severity === 'Critical').length;
  const highCount = activeBugs.filter((b) => b.severity === 'High').length;
  const mediumCount = activeBugs.filter((b) => b.severity === 'Medium').length;
  const lowCount = activeBugs.filter((b) => b.severity === 'Low').length;
  const maxSeverityCount = Math.max(criticalCount, highCount, mediumCount, lowCount, 1);

  const getUserName = (id?: string | null) => {
    if (!id) return 'Unassigned';
    return MOCK_USERS.find((u) => u.id === id)?.name || 'QA Team';
  };

  const previewBug = bugs[0] || null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-navy-900">Overview</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary-light text-primary border border-primary/20">
              {currentProject?.name || 'Active Project'}
            </span>
          </div>
          <p className="text-xs text-secondary mt-1">
            Test execution and defect intelligence scoped to {currentProject?.name || 'your active project'}.
          </p>
        </div>
        <Button onClick={() => setIsLogBugOpen(true)} size="md">
          <Plus size={16} /> Log Bug
        </Button>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Open Bugs"
          value={openCount}
          subtext="Requires triage"
          subtextColor="red"
          icon={<AlertCircle size={18} />}
        />
        <MetricCard
          label="In Progress"
          value={inProgressCount}
          subtext="Engineering fixing"
          subtextColor="gray"
          icon={<div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>}
        />
        <MetricCard
          label="Retest"
          value={retestCount}
          subtext="Awaiting QA verify"
          subtextColor="purple"
          icon={<div className="w-2 h-2 rounded-full bg-purple-500"></div>}
        />
        <MetricCard
          label="Closed"
          value={closedCount}
          subtext="Resolved this sprint"
          subtextColor="green"
          icon={<div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
        />
      </div>

      {/* Row 2: Visual Charts / Metrics Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Run Execution Rate */}
        <div className="bg-surface rounded-card border border-border p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div>
                <h3 className="text-sm font-semibold text-navy-900">Test Execution Progress</h3>
                <p className="text-xs text-secondary mt-0.5">
                  Based on {executions.length} recorded executions in this project
                </p>
              </div>
              <span className="text-xs font-bold px-2 py-1 bg-soft rounded text-navy-900 border border-border">
                {executions.length} total
              </span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="mt-5 space-y-2">
              <div className="h-3 w-full bg-track rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${passedPct}%` }}
                  className="bg-emerald-500 transition-all duration-300"
                  title={`Passed: ${passedCount}`}
                ></div>
                <div
                  style={{ width: `${failedPct}%` }}
                  className="bg-red-500 transition-all duration-300"
                  title={`Failed: ${failedCount}`}
                ></div>
                <div
                  style={{ width: `${blockedPct}%` }}
                  className="bg-amber-400 transition-all duration-300"
                  title={`Blocked: ${blockedCount}`}
                ></div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-between pt-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-secondary font-medium">Passed:</span>
                  <span className="font-semibold text-navy-900">{passedCount} ({passedPct}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span className="text-secondary font-medium">Failed:</span>
                  <span className="font-semibold text-navy-900">{failedCount} ({failedPct}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span className="text-secondary font-medium">Blocked:</span>
                  <span className="font-semibold text-navy-900">{blockedCount} ({blockedPct}%)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 text-xs text-secondary flex items-center justify-between">
            <span>Sprint Execution Health</span>
            <span className="font-semibold text-emerald-600">
              {passedPct >= 70 ? 'Optimal (Passing)' : 'Needs Attention'}
            </span>
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="bg-surface rounded-card border border-border p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div>
                <h3 className="text-sm font-semibold text-navy-900">Active Bugs by Severity</h3>
                <p className="text-xs text-secondary mt-0.5">Triage load for active tickets</p>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded border badge-critical">
                {activeBugs.length} Active
              </span>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex items-center gap-3">
                <span className="w-16 font-medium text-navy-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span> Critical
                </span>
                <div className="flex-1 bg-track h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-red-600 h-2 rounded-full"
                    style={{ width: `${(criticalCount / maxSeverityCount) * 100}%` }}
                  ></div>
                </div>
                <span className="w-6 text-right font-semibold text-navy-900">{criticalCount}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-16 font-medium text-navy-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> High
                </span>
                <div className="flex-1 bg-track h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full"
                    style={{ width: `${(highCount / maxSeverityCount) * 100}%` }}
                  ></div>
                </div>
                <span className="w-6 text-right font-semibold text-navy-900">{highCount}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-16 font-medium text-navy-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> Medium
                </span>
                <div className="flex-1 bg-track h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${(mediumCount / maxSeverityCount) * 100}%` }}
                  ></div>
                </div>
                <span className="w-6 text-right font-semibold text-navy-900">{mediumCount}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-16 font-medium text-navy-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Low
                </span>
                <div className="flex-1 bg-track h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${(lowCount / maxSeverityCount) * 100}%` }}
                  ></div>
                </div>
                <span className="w-6 text-right font-semibold text-navy-900">{lowCount}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 text-xs text-secondary flex items-center justify-between">
            <span>Critical bugs require immediate triage</span>
            <span className="font-semibold text-red-600">{criticalCount} critical</span>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Bugs Table & AI Bug Intelligence Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bugs Table (2 cols) */}
        <div className="lg:col-span-2 bg-surface rounded-card border border-border p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div>
                <h3 className="text-sm font-semibold text-navy-900">Recent Bugs</h3>
                <p className="text-xs text-secondary mt-0.5">Latest activity in {currentProject?.name}</p>
              </div>
              <button
                onClick={() => navigate('/bugs')}
                className="text-xs text-primary hover:text-primary-hover font-medium flex items-center gap-1"
              >
                View all ({bugs.length}) <ArrowRight size={13} />
              </button>
            </div>

            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-secondary uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Bug ID</th>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Assignee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bugs.slice(0, 5).map((bug) => (
                    <tr
                      key={bug.id}
                      onClick={() => navigate(`/bugs/${bug.id}`)}
                      className="hover:bg-soft cursor-pointer transition-colors group"
                    >
                      <td className="py-2.5 px-3 font-semibold text-primary group-hover:underline whitespace-nowrap">
                        {bug.bug_code}
                      </td>
                      <td className="py-2.5 px-3 text-navy-900 font-medium max-w-[240px] truncate">
                        {bug.title}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <SeverityBadge severity={bug.severity} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <StatusBadge status={bug.status} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-secondary whitespace-nowrap">
                        {getUserName(bug.assignee_id)}
                      </td>
                    </tr>
                  ))}
                  {bugs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-secondary">
                        No bugs found in this project.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 text-right">
            <button
              onClick={() => navigate('/bugs')}
              className="text-xs text-primary hover:text-primary-hover font-semibold inline-flex items-center gap-1"
            >
              Open Bug Tracker →
            </button>
          </div>
        </div>

        {/* AI Bug Intelligence Panel (1 col) - HONEST DEMO STATE (Part 8) */}
        <div className="bg-surface rounded-card border border-border p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary-light text-primary">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-navy-900">AI Bug Intelligence</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border badge-ai-preview">
                      AI Preview — Demo Data
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-muted p-2 rounded-lg bg-soft border border-border">
              <Info size={13} className="shrink-0 mt-0.5 text-secondary" />
              <span>Illustrative recommendations. Live AI analysis is not yet connected.</span>
            </div>

            {previewBug ? (
              <div className="mt-3 p-4 rounded-xl bg-soft border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-primary">{previewBug.bug_code}</span>
                  <span className="text-[10px] bg-primary-light text-primary font-medium px-2 py-0.5 rounded-full border border-primary/20">
                    Preview Insight
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-navy-900 mb-2 leading-snug">
                  {previewBug.title}
                </h4>
                <p className="text-[11px] text-secondary mb-3">
                  Illustrative triage suggestions & potential duplicate candidate for review.
                </p>

                <div className="space-y-1.5 text-[11px] bg-surface p-2.5 rounded-lg border border-border">
                  <div className="flex justify-between">
                    <span className="text-muted">Suggested Category:</span>
                    <span className="font-medium text-navy-900">{previewBug.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Suggested Severity:</span>
                    <span className="font-semibold text-red-600">{previewBug.severity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Suggested Priority:</span>
                    <span className="font-semibold text-navy-900">{previewBug.priority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Potential Duplicate:</span>
                    <span className="font-medium text-purple-700 dark:text-purple-400">
                      {previewBug.project_id === 'prj-002' ? 'BUG-00488 · 89%' : 'BUG-00398 · 82%'}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <Button
                    onClick={() => navigate(`/bugs/${previewBug.id}`)}
                    size="sm"
                    className="w-full text-xs"
                  >
                    Review preview suggestions →
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-secondary">
                No bugs available for preview in this project.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 text-[11px] text-muted leading-tight">
            AI recommendations remain illustrative demo content and will require human engineer approval when live model is connected.
          </div>
        </div>
      </div>

      {/* Log Bug Modal */}
      <CreateBugModal
        isOpen={isLogBugOpen}
        onClose={() => setIsLogBugOpen(false)}
        onSuccess={(newBug) => {
          setBugs((prev) => [newBug, ...prev]);
        }}
      />
    </div>
  );
};
