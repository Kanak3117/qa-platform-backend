import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Sparkles, ArrowRight, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '../components/common/Button';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { CreateBugModal } from '../components/bugs/CreateBugModal';
import { api } from '../lib/api';
import { Bug, TestExecution } from '../types';
import { MOCK_USERS } from '../lib/mockData';

export const Overview: React.FC = () => {
  const navigate = useNavigate();
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [executions, setExecutions] = useState<TestExecution[]>([]);
  const [isLogBugOpen, setIsLogBugOpen] = useState(false);

  const loadData = async () => {
    try {
      const [fetchedBugs, fetchedExecutions] = await Promise.all([
        api.getBugs(),
        api.getExecutions(),
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
  }, []);

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900">Overview</h1>
          <p className="text-xs text-secondary mt-1">
            Test execution and defect intelligence at a glance.
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
          subtext="Ready for QA verification"
          subtextColor="purple"
          icon={<CheckCircle2 size={18} />}
        />
        <MetricCard
          label="Closed"
          value={closedCount}
          subtext="Verified this sprint"
          subtextColor="green"
          icon={<CheckCircle2 size={18} />}
        />
      </div>

      {/* Row 2: Test Execution Health & Bugs by Severity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Execution Health Card */}
        <div className="bg-surface rounded-card border border-border p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div>
                <h3 className="text-sm font-semibold text-navy-900">Test Execution Health</h3>
                <p className="text-xs text-secondary mt-0.5">Current test run: Sprint 24 Final Regression</p>
              </div>
              <button
                onClick={() => navigate('/test-runs')}
                className="text-xs text-primary hover:text-primary-hover font-medium flex items-center gap-1"
              >
                View Runs <ArrowRight size={13} />
              </button>
            </div>

            <div className="space-y-3.5 mt-4">
              {/* Passed */}
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="flex items-center gap-1.5 text-navy-900">
                    <CheckCircle2 size={14} className="text-emerald-600" /> Passed
                  </span>
                  <span className="text-secondary">{passedPct}% ({passedCount})</span>
                </div>
                <div className="w-full bg-track h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${passedPct}%` }}
                  ></div>
                </div>
              </div>

              {/* Failed */}
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="flex items-center gap-1.5 text-navy-900">
                    <XCircle size={14} className="text-rose-600" /> Failed
                  </span>
                  <span className="text-secondary">{failedPct}% ({failedCount})</span>
                </div>
                <div className="w-full bg-track h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${failedPct}%` }}
                  ></div>
                </div>
              </div>

              {/* Blocked */}
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="flex items-center gap-1.5 text-navy-900">
                    <AlertCircle size={14} className="text-amber-500" /> Blocked
                  </span>
                  <span className="text-secondary">{blockedPct}% ({blockedCount})</span>
                </div>
                <div className="w-full bg-track h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${blockedPct}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-secondary">
            <span>{executions.length} test executions recorded</span>
            <span className="font-medium text-navy-900">{passedPct}% overall pass rate</span>
          </div>
        </div>

        {/* Bugs by Severity Card */}
        <div className="bg-surface rounded-card border border-border p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div>
                <h3 className="text-sm font-semibold text-navy-900">Bugs by Severity</h3>
                <p className="text-xs text-secondary mt-0.5">{activeBugs.length} open/in-progress defects</p>
              </div>
              <button
                onClick={() => navigate('/bugs')}
                className="text-xs text-primary hover:text-primary-hover font-medium flex items-center gap-1"
              >
                All Bugs <ArrowRight size={13} />
              </button>
            </div>

            <div className="space-y-3 mt-4 text-xs">
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
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span> High
                </span>
                <div className="flex-1 bg-track h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{ width: `${(highCount / maxSeverityCount) * 100}%` }}
                  ></div>
                </div>
                <span className="w-6 text-right font-semibold text-navy-900">{highCount}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-16 font-medium text-navy-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Medium
                </span>
                <div className="flex-1 bg-track h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full"
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
                <p className="text-xs text-secondary mt-0.5">Latest activity across the project</p>
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
                  <tr className="border-b border-gray-100 text-secondary uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Bug ID</th>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Assignee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
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

        {/* AI Bug Intelligence Panel (1 col) */}
        <div className="bg-surface rounded-card border border-border p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>

          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary-light text-primary">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-navy-900">AI Bug Intelligence</h3>
                  <p className="text-[11px] text-secondary">Recommendations awaiting QA review</p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-soft to-primary-light/20 border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-primary">BUG-00301</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full">
                  AI analysis ready
                </span>
              </div>
              <h4 className="text-xs font-semibold text-navy-900 mb-2 leading-snug">
                Payment gateway timeout triggers HTTP 500 without retrying idempotency key
              </h4>
              <p className="text-[11px] text-secondary mb-3">
                Identified 4 triage suggestions & potential duplicate candidate.
              </p>

              <div className="space-y-1.5 text-[11px] bg-white p-2.5 rounded-lg border border-border">
                <div className="flex justify-between">
                  <span className="text-muted">Category:</span>
                  <span className="font-medium text-navy-900">Payment / Checkout</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Severity:</span>
                  <span className="font-semibold text-red-600">Critical</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Priority:</span>
                  <span className="font-semibold text-navy-900">P1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Duplicate match:</span>
                  <span className="font-medium text-purple-700">BUG-00398 · 82%</span>
                </div>
              </div>

              <div className="mt-3">
                <Button
                  onClick={() => navigate('/bugs/b-301')}
                  size="sm"
                  className="w-full text-xs"
                >
                  Review suggestions →
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 text-[11px] text-muted leading-tight">
            AI outputs are recommendations and remain editable by the QA engineer.
          </div>
        </div>
      </div>

      {/* Log Bug Modal */}
      <CreateBugModal
        isOpen={isLogBugOpen}
        onClose={() => setIsLogBugOpen(false)}
        onSuccess={() => {
          void loadData();
        }}
      />
    </div>
  );
};
