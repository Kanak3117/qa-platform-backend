import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlayCircle,
  ArrowLeft,
  Bug as BugIcon,
  Clock,
  Layers
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { CreateBugModal } from '../components/bugs/CreateBugModal';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { TestCase, TestRun, TestExecution as ITestExecution, ExecutionResult, Bug } from '../types';
import { MOCK_USERS } from '../lib/mockData';

export const TestExecutionPage: React.FC = () => {
  const { testCaseId } = useParams<{ testCaseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [testCase, setTestCase] = useState<TestCase | null>(null);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>('');
  const [executions, setExecutions] = useState<ITestExecution[]>([]);
  const [selectedResult, setSelectedResult] = useState<ExecutionResult>('Passed');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastExecutedId, setLastExecutedId] = useState<string | null>(null);
  const [isLogBugOpen, setIsLogBugOpen] = useState(false);

  useEffect(() => {
    api.getTestRuns().then((runs) => {
      setTestRuns(runs);
      if (runs.length > 0 && !selectedRunId) setSelectedRunId(runs[0].id);
    });
    const unsub = api.subscribe(() => {
      api.getTestRuns().then(setTestRuns);
      if (selectedRunId) api.getExecutions(selectedRunId).then(setExecutions);
    });
    return () => unsub();
  }, [selectedRunId]);

  useEffect(() => {
    if (testCaseId) {
      api.getTestCaseById(testCaseId).then((tc) => {
        if (tc) {
          setTestCase(tc);
        } else {
          // If no specific case found, get first available
          api.getTestCases().then((cases) => {
            if (cases.length > 0) setTestCase(cases[0]);
          });
        }
      });
    } else {
      api.getTestCases().then((cases) => {
        if (cases.length > 0) setTestCase(cases[0]);
      });
    }
  }, [testCaseId]);

  useEffect(() => {
    if (selectedRunId) {
      api.getExecutions(selectedRunId).then(setExecutions);
    }
  }, [selectedRunId]);

  const handleSubmitResult = async () => {
    if (!testCase || !selectedRunId) return;
    setIsSubmitting(true);
    try {
      const exec = await api.executeTestCase(
        selectedRunId,
        testCase.id,
        selectedResult,
        user?.id || 'usr-101'
      );
      setLastExecutedId(exec.id);
      const updatedExecs = await api.getExecutions(selectedRunId);
      setExecutions(updatedExecs);

      // If execution was Failed, automatically prompt user or offer bug creation
      if (selectedResult === 'Failed') {
        setIsLogBugOpen(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserName = (id: string) => {
    return MOCK_USERS.find((u) => u.id === id)?.name || 'QA Tester';
  };

  if (!testCase) {
    return (
      <div className="py-12 text-center text-secondary">
        Loading test case execution details...
      </div>
    );
  }

  const caseExecutions = executions.filter((e) => e.test_case_id === testCase.id);

  return (
    <div className="space-y-6">
      {/* Top back link */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/test-cases')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-navy-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Test Cases
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-secondary">Test Run:</span>
          <select
            value={selectedRunId}
            onChange={(e) => setSelectedRunId(e.target.value)}
            className="text-xs bg-surface border border-border rounded-lg px-2.5 py-1.5 text-navy-900 font-medium focus:ring-1 focus:ring-primary"
          >
            {testRuns.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Execution Card */}
      <div className="bg-surface rounded-card border border-border p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold text-primary bg-primary-light px-2.5 py-0.5 rounded">
                {testCase.id}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-navy-800">
                Priority: {testCase.priority}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                {testCase.status}
              </span>
            </div>
            <h1 className="text-lg font-bold text-navy-900">{testCase.title}</h1>
            <p className="text-xs text-secondary mt-1">{testCase.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsLogBugOpen(true)}
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <BugIcon size={14} /> Log Bug for this Case
            </Button>
          </div>
        </div>

        {/* Steps and Expected Result */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-soft p-4 rounded-xl border border-border">
            <h3 className="text-xs font-semibold text-navy-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers size={14} className="text-primary" /> Test Execution Steps
            </h3>
            <div className="text-xs text-navy-900 whitespace-pre-wrap leading-relaxed font-mono">
              {testCase.steps}
            </div>
          </div>

          <div className="bg-soft p-4 rounded-xl border border-border">
            <h3 className="text-xs font-semibold text-navy-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600" /> Expected Result
            </h3>
            <div className="text-xs text-secondary leading-relaxed">
              {testCase.expected_result}
            </div>
          </div>
        </div>

        {/* Result Selector & Action Bar */}
        <div className="mt-6 pt-5 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-navy-900">Record Result:</span>
            <div className="inline-flex rounded-lg border border-border bg-soft p-1 gap-1">
              <button
                type="button"
                onClick={() => setSelectedResult('Passed')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  selectedResult === 'Passed'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-secondary hover:text-navy-900'
                }`}
              >
                <CheckCircle2 size={14} /> Passed
              </button>
              <button
                type="button"
                onClick={() => setSelectedResult('Failed')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  selectedResult === 'Failed'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-secondary hover:text-navy-900'
                }`}
              >
                <XCircle size={14} /> Failed
              </button>
              <button
                type="button"
                onClick={() => setSelectedResult('Blocked')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  selectedResult === 'Blocked'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-secondary hover:text-navy-900'
                }`}
              >
                <AlertCircle size={14} /> Blocked
              </button>
            </div>
          </div>

          <Button
            size="md"
            onClick={handleSubmitResult}
            isLoading={isSubmitting}
            className="w-full sm:w-auto"
          >
            <PlayCircle size={16} /> Submit Execution Result
          </Button>
        </div>
      </div>

      {/* Execution History */}
      <div className="bg-surface rounded-card border border-border p-5 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <Clock size={16} className="text-secondary" />
          <h3 className="text-sm font-semibold text-navy-900">Execution History for this Case</h3>
        </div>

        <div className="mt-4 overflow-x-auto">
          {caseExecutions.length === 0 ? (
            <div className="text-center py-6 text-xs text-secondary">
              No executions logged yet for this test case in the selected run.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-secondary uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Execution ID</th>
                  <th className="py-2.5 px-3">Result</th>
                  <th className="py-2.5 px-3">Executed By</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {caseExecutions.map((exec) => (
                  <tr key={exec.id} className="hover:bg-soft">
                    <td className="py-2.5 px-3 font-mono text-secondary">{exec.id}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                          exec.result === 'Passed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : exec.result === 'Failed'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {exec.result === 'Passed' && <CheckCircle2 size={12} />}
                        {exec.result === 'Failed' && <XCircle size={12} />}
                        {exec.result === 'Blocked' && <AlertCircle size={12} />}
                        {exec.result}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-navy-900">{getUserName(exec.executed_by)}</td>
                    <td className="py-2.5 px-3 text-muted">
                      {new Date(exec.executed_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {exec.result === 'Failed' && (
                        <button
                          onClick={() => {
                            setLastExecutedId(exec.id);
                            setIsLogBugOpen(true);
                          }}
                          className="text-primary hover:underline font-medium inline-flex items-center gap-1 text-[11px]"
                        >
                          <BugIcon size={12} /> Log Defect
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Log Bug Modal prefilled with this case and execution */}
      <CreateBugModal
        isOpen={isLogBugOpen}
        onClose={() => setIsLogBugOpen(false)}
        initialTestCaseId={testCase.id}
        initialExecutionId={lastExecutedId}
        onSuccess={(bug: Bug) => {
          navigate(`/bugs/${bug.id}`);
        }}
      />
    </div>
  );
};
