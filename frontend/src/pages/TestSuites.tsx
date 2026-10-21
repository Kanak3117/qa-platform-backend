import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderGit2, Plus, ArrowRight } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { TestSuite, TestCase } from '../types';

export const TestSuites: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject } = useAuth();
  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [cases, setCases] = useState<TestCase[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = () => {
    Promise.all([api.getTestSuites(), api.getTestCases()]).then(([s, c]) => {
      setSuites(s);
      setCases(c);
    });
  };

  useEffect(() => {
    loadData();
    const unsub = api.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const newSuite = await api.createTestSuite({
        name,
        description,
        project_id: currentProject?.id || 'prj-001',
      });
      setSuites((prev) => [newSuite, ...prev]);
      setIsCreateOpen(false);
      setName('');
      setDescription('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCaseCount = (suiteId: string) => {
    return cases.filter((c) => c.test_suite_id === suiteId).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900">Test Suites</h1>
          <p className="text-xs text-secondary mt-1">
            Organize modules, regression packages, and automated smoke test collections.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size="md">
          <Plus size={16} /> New Test Suite
        </Button>
      </div>

      {/* Test Suites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {suites.map((suite) => {
          const count = getCaseCount(suite.id);
          return (
            <div
              key={suite.id}
              className="bg-surface rounded-card border border-border p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-primary-light text-primary">
                    <FolderGit2 size={18} />
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-soft text-secondary border border-border">
                    {count} {count === 1 ? 'test case' : 'test cases'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-navy-900 group-hover:text-primary transition-colors">
                  {suite.name}
                </h3>
                <p className="text-xs text-secondary mt-1.5 leading-relaxed line-clamp-2">
                  {suite.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-border/70 flex items-center justify-between">
                <span className="text-[11px] font-mono text-muted">{suite.id}</span>
                <button
                  onClick={() => navigate('/test-cases')}
                  className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
                >
                  View Cases <ArrowRight size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Suite Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Test Suite">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-navy-900 mb-1">Suite Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Payment Gateway & 3D Secure E2E"
              className="w-full text-xs px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Module scope, prerequisites, or target regression boundary..."
              className="w-full text-xs px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Create Test Suite
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
