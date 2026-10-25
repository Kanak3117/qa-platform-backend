import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  PlayCircle,
  Bug,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { TestCase, TestRun, Bug as IBug } from '../types';

export const QATesterWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject } = useAuth();
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [retestBugs, setRetestBugs] = useState<IBug[]>([]);

  const loadData = () => {
    Promise.all([
      api.getTestCases(undefined, currentProject?.id),
      api.getTestRuns(currentProject?.id),
      api.getBugs(currentProject?.id)
    ]).then(([cases, runs, bugs]) => {
      setTestCases(cases);
      setTestRuns(runs);
      setRetestBugs(bugs.filter((b) => b.status === 'Retest' || b.status === 'Open'));
    });
  };

  useEffect(() => {
    loadData();
    const unsub = api.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, [currentProject?.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary-light text-primary">
              <FlaskConical size={18} />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-navy-900">
              QA Tester Workspace
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary-light text-primary border border-primary/20">
              {currentProject?.name || 'Active Project'}
            </span>
          </div>
          <p className="text-xs text-secondary mt-1">
            Focus view for manual execution, test automation triage, and fix verification in {currentProject?.name}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/test-cases')}
          >
            Manage Cases
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/test-execution/tc-001')}
          >
            <PlayCircle size={15} /> Start Execution
          </Button>
        </div>
      </div>

      {/* QA Specific Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Active Test Cases"
          value={testCases.length}
          subtext="Covered across 3 test suites"
          subtextColor="gray"
          icon={<ShieldCheck size={18} />}
        />
        <MetricCard
          label="Pending Retest"
          value={retestBugs.filter((b) => b.status === 'Retest').length}
          subtext="Ready for QA sign-off"
          subtextColor="purple"
          icon={<CheckCircle2 size={18} />}
        />
        <MetricCard
          label="Active Test Runs"
          value={testRuns.length}
          subtext="1 regression in progress"
          subtextColor="gray"
          icon={<Clock size={18} />}
        />
        <MetricCard
          label="Unassigned Defects"
          value={retestBugs.filter((b) => !b.assignee_id).length}
          subtext="Requires developer triage"
          subtextColor="red"
          icon={<Bug size={18} />}
        />
      </div>

      {/* 2-Column Split: Active Test Runs vs Retest Verification Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Test Runs Card */}
        <div className="bg-surface rounded-card border border-border p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-semibold text-navy-900">Active Test Runs</h3>
              <button
                onClick={() => navigate('/test-runs')}
                className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
              >
                All Runs <ArrowRight size={13} />
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {testRuns.map((run) => (
                <div
                  key={run.id}
                  onClick={() => navigate('/test-runs')}
                  className="p-3.5 rounded-lg border border-border bg-soft hover:bg-border/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-xs text-navy-900">{run.name}</span>
                    <span className="text-[10px] font-medium badge-inprogress px-2 py-0.5 rounded border">
                      In Progress
                    </span>
                  </div>
                  <div className="text-[11px] text-secondary flex items-center gap-3">
                    <span>Started: {new Date(run.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="text-primary font-medium">3 test executions logged</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/test-execution/tc-001')}
            >
              Resume Test Run →
            </Button>
          </div>
        </div>

        {/* Retest Verification Queue */}
        <div className="bg-surface rounded-card border border-border p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-semibold text-navy-900">Retest & Verification Queue</h3>
              <span className="text-xs font-semibold badge-retest px-2 py-0.5 rounded border">
                Fix Verification
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {retestBugs.slice(0, 4).map((bug) => (
                <div
                  key={bug.id}
                  onClick={() => navigate(`/bugs/${bug.id}`)}
                  className="p-3 rounded-lg border border-border hover:bg-soft cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="truncate">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-primary">{bug.bug_code}</span>
                      <SeverityBadge severity={bug.severity} size="sm" />
                      <StatusBadge status={bug.status} size="sm" />
                    </div>
                    <div className="font-medium text-navy-900 truncate">{bug.title}</div>
                  </div>
                  <ArrowRight size={14} className="text-secondary shrink-0" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-secondary">
            <span>Verify resolved bugs before closing</span>
            <button
              onClick={() => navigate('/bugs')}
              className="text-primary hover:underline font-semibold"
            >
              View all bugs →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
