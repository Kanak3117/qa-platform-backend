import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, PlayCircle, Filter } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { TestCase, TestSuite } from '../types';

export const TestCases: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const suiteParam = searchParams.get('suiteId');
  const [cases, setCases] = useState<TestCase[]>([]);
  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [filteredCases, setFilteredCases] = useState<TestCase[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSuite, setSelectedSuite] = useState<string>(suiteParam || 'ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [expectedResult, setExpectedResult] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [suiteId, setSuiteId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = () => {
    Promise.all([
      api.getTestCases(undefined, currentProject?.id),
      api.getTestSuites(currentProject?.id)
    ]).then(([c, s]) => {
      setCases(c);
      setSuites(s);
      if (s.length > 0) {
        setSuiteId(s[0].id);
      }
    });
  };

  useEffect(() => {
    loadData();
    const unsub = api.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, [currentProject?.id]);

  useEffect(() => {
    if (suiteParam) {
      setSelectedSuite(suiteParam);
    } else {
      setSelectedSuite('ALL');
    }
  }, [suiteParam]);

  useEffect(() => {
    let result = [...cases];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) => c.title.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
      );
    }
    if (selectedSuite !== 'ALL') {
      result = result.filter((c) => c.test_suite_id === selectedSuite);
    }
    setFilteredCases(result);
  }, [search, selectedSuite, cases]);

  const handleSuiteChange = (newSuite: string) => {
    setSelectedSuite(newSuite);
    if (newSuite === 'ALL') {
      setSearchParams({});
    } else {
      setSearchParams({ suiteId: newSuite });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !suiteId) return;
    setIsSubmitting(true);
    try {
      const newCase = await api.createTestCase({
        title,
        description,
        steps,
        expected_result: expectedResult,
        priority,
        status: 'Active',
        test_suite_id: suiteId,
      });
      setCases((prev) => [newCase, ...prev]);
      setIsCreateOpen(false);
      setTitle('');
      setDescription('');
      setSteps('');
      setExpectedResult('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSuiteName = (id: string) => {
    return suites.find((s) => s.id === id)?.name || id;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900">Test Cases</h1>
          <p className="text-xs text-secondary mt-1">
            Author test steps, maintain execution verifications, and run test cycles.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size="md">
          <Plus size={16} /> New Test Case
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface rounded-card border border-border p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-2.5 text-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search test case title or ID (e.g. tc-001)..."
            className="w-full text-xs bg-soft border border-border rounded-lg pl-9 pr-3 py-2 text-navy-900 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-secondary" />
          <select
            value={selectedSuite}
            onChange={(e) => handleSuiteChange(e.target.value)}
            className="text-xs bg-soft border border-border rounded-lg px-2.5 py-1.5 text-navy-900 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Test Suites</option>
            {suites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Test Cases Table Card */}
      <div className="bg-surface rounded-card border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-soft/70 border-b border-border text-secondary uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Suite</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-secondary">
                    No test cases found in this test suite.
                  </td>
                </tr>
              ) : (
                filteredCases.map((tc) => (
                <tr key={tc.id} className="hover:bg-soft transition-colors group">
                  <td className="py-3 px-4 font-mono font-semibold text-primary whitespace-nowrap">
                    {tc.id}
                  </td>
                  <td className="py-3 px-4 max-w-sm">
                    <div className="font-semibold text-navy-900">{tc.title}</div>
                    <div className="text-[11px] text-secondary line-clamp-1 mt-0.5">
                      {tc.description}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-secondary whitespace-nowrap">
                    {getSuiteName(tc.test_suite_id)}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <PriorityBadge priority={tc.priority} size="sm" />
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="badge-passed px-2 py-0.5 rounded text-[11px] font-medium border inline-flex items-center">
                      {tc.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <Button
                      size="sm"
                      onClick={() => navigate(`/test-execution/${tc.id}`)}
                      className="text-xs py-1"
                    >
                      <PlayCircle size={13} /> Execute
                    </Button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Author Test Case" maxWidth="xl">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-navy-900 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Verify order total calculation with promotional voucher"
              className="w-full text-xs px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Test Suite *</label>
              <select
                value={suiteId}
                onChange={(e) => setSuiteId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-surface text-navy-900 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {suites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-navy-900 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-surface text-navy-900 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary and objective of the verification"
              className="w-full text-xs px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Step-by-step Actions</label>
            <textarea
              rows={3}
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder="1. Open page&#10;2. Click checkout&#10;3. Observe response"
              className="w-full text-xs px-3 py-2 border border-border rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Expected Result</label>
            <textarea
              rows={2}
              value={expectedResult}
              onChange={(e) => setExpectedResult(e.target.value)}
              placeholder="System accepts voucher and applies 15% discount to line items."
              className="w-full text-xs px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Save Test Case
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
