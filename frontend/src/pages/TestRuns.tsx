import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Plus, Clock } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { TestRun, TestExecution } from '../types';

export const TestRuns: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject } = useAuth();
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [executions, setExecutions] = useState<TestExecution[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = () => {
    Promise.all([
      api.getTestRuns(currentProject?.id),
      api.getExecutions(undefined, currentProject?.id)
    ]).then(([r, e]) => {
      setRuns(r);
      setExecutions(e);
    });
  };

  useEffect(() => {
    loadData();
    const unsub = api.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, [currentProject?.id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const newRun = await api.createTestRun(name, currentProject?.id || 'prj-001');
      setRuns((prev) => [newRun, ...prev]);
      setIsCreateOpen(false);
      setName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRunExecutions = (runId: string) => {
    return executions.filter((e) => e.test_run_id === runId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900">Test Runs</h1>
          <p className="text-xs text-secondary mt-1">
            Execute batches of regression test cases and track execution pass/fail health.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size="md">
          <Plus size={16} /> New Test Run
        </Button>
      </div>

      {/* Test Runs List */}
      <div className="space-y-4">
        {runs.map((run) => {
          const runExecs = getRunExecutions(run.id);
          const passed = runExecs.filter((e) => e.result === 'Passed').length;
          const failed = runExecs.filter((e) => e.result === 'Failed').length;
          const blocked = runExecs.filter((e) => e.result === 'Blocked').length;
          const total = runExecs.length || 1;
          const passPct = Math.round((passed / total) * 100);

          return (
            <div
              key={run.id}
              className="bg-surface rounded-card border border-border p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/40 transition-all"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary bg-primary-light px-2 py-0.5 rounded">
                    {run.id}
                  </span>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Active Run
                  </span>
                </div>
                <h3 className="text-base font-bold text-navy-900">{run.name}</h3>
                <div className="text-xs text-secondary flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock size={13} /> Started {new Date(run.created_at).toLocaleDateString()}
                  </span>
                  <span>•</span>
                  <span>{runExecs.length} executions recorded</span>
                </div>
              </div>

              {/* Progress and status summary */}
              <div className="flex items-center gap-6">
                <div className="w-48 hidden sm:block">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-navy-900">Health</span>
                    <span className="text-emerald-600">{passPct}% Pass</span>
                  </div>
                  <div className="w-full bg-track h-2 rounded-full overflow-hidden flex">
                    <div style={{ width: `${(passed / total) * 100}%` }} className="bg-emerald-500 h-2"></div>
                    <div style={{ width: `${(failed / total) * 100}%` }} className="bg-rose-500 h-2"></div>
                    <div style={{ width: `${(blocked / total) * 100}%` }} className="bg-amber-400 h-2"></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted mt-1">
                    <span>{passed} P</span>
                    <span>{failed} F</span>
                    <span>{blocked} B</span>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => navigate('/test-execution/tc-001')}
                  className="whitespace-nowrap"
                >
                  <PlayCircle size={14} /> Execute Run
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Run Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Initialize New Test Run">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-navy-900 mb-1">Test Run Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sprint 25 Pre-Release Full Regression"
              className="w-full text-xs px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <p className="text-[11px] text-secondary">
            Creating this test run will initialize an active execution session across the selected project test cases.
          </p>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Start Test Run
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
