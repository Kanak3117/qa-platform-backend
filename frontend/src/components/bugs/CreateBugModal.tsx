import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Bug, BugAnalysisSuggestion, BugSeverity, TestCase, User } from '../../types';
import { MOCK_USERS } from '../../lib/mockData';

interface CreateBugModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newBug: Bug) => void;
  initialTestCaseId?: string | null;
  initialExecutionId?: string | null;
}

export const CreateBugModal: React.FC<CreateBugModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTestCaseId,
  initialExecutionId,
}) => {
  const { currentProject, user } = useAuth();
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [users] = useState<User[]>(MOCK_USERS);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Payment / Checkout');
  const [severity, setSeverity] = useState<BugSeverity>('High');
  const [priority, setPriority] = useState('P2');
  const [testCaseId, setTestCaseId] = useState<string>(initialTestCaseId || '');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<BugAnalysisSuggestion | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAiAnalysis(null);
      setAiError(null);
      api.getTestCases().then((cases) => {
        setTestCases(cases);
        if (initialTestCaseId) {
          const matched = cases.find(c => c.id === initialTestCaseId);
          if (matched && !title) {
            setTitle(`Failure: ${matched.title}`);
            setDescription(`Execution failed for test case: ${matched.title}\n\nSteps:\n${matched.steps}\n\nExpected:\n${matched.expected_result}`);
          }
        }
      });
      if (initialTestCaseId) setTestCaseId(initialTestCaseId);
    }
  }, [isOpen, initialTestCaseId]);

  const handleAnalyzeAI = async () => {
    if (!currentProject) {
      setAiError('Select a project before requesting AI analysis.');
      return;
    }
    if (description.trim().length < 10) {
      setAiError('Enter at least 10 characters in the description before requesting analysis.');
      return;
    }

    setIsAnalyzingAI(true);
    setAiError(null);
    try {
      const result = await api.analyzeBug(currentProject.id, title, description);
      setAiAnalysis(result);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI analysis failed.');
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  const applyAISuggestions = () => {
    if (!aiAnalysis) return;
    setTitle(aiAnalysis.suggested_title);
    setCategory(aiAnalysis.category);
    setSeverity(aiAnalysis.severity);
    setPriority(aiAnalysis.priority);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const bug = await api.createBug({
        title,
        description,
        category,
        severity,
        priority,
        project_id: currentProject?.id || 'prj-001',
        test_case_id: testCaseId || null,
        test_execution_id: initialExecutionId || null,
        assignee_id: assigneeId || null,
        reporter_id: user?.id || 'usr-101',
        due_date: dueDate || null,
        status: 'Open',
      });

      onSuccess(bug);
      onClose();
      // Reset fields
      setTitle('');
      setDescription('');
      setAiAnalysis(null);
      setAiError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to create bug');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Defect" maxWidth="xl">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block font-semibold text-navy-900 mb-1">Bug Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setAiAnalysis(null);
            }}
            placeholder="e.g. Checkout fails on expired card with unhandled exception"
            className="w-full text-xs px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-navy-900 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="Payment / Checkout">Payment / Checkout</option>
              <option value="Authentication">Authentication</option>
              <option value="Performance">Performance</option>
              <option value="UI / UX">UI / UX</option>
              <option value="API / Backend">API / Backend</option>
              <option value="Security">Security</option>
              <option value="Functional">Functional</option>
              <option value="Stability">Stability</option>
              <option value="Data Integrity">Data Integrity</option>
              <option value="Database">Database</option>
              <option value="Integration">Integration</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Related Test Case</label>
            <select
              value={testCaseId}
              onChange={(e) => setTestCaseId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary truncate"
            >
              <option value="">None / Standalone Defect</option>
              {testCases.map((tc) => (
                <option key={tc.id} value={tc.id}>
                  {tc.id} — {tc.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-navy-900 mb-1">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as BugSeverity)}
              className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
              <option value="Informational">Informational</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="P1">P1 (Immediate)</option>
              <option value="P2">P2 (High)</option>
              <option value="P3">P3 (Medium)</option>
              <option value="P4">P4 (Low)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Assignee</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.system_role})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-navy-900 mb-1">Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block font-semibold text-navy-900 mb-1">Description & Steps to Reproduce</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setAiAnalysis(null);
            }}
            placeholder="Detailed description of defect, steps to reproduce, actual vs expected result..."
            className="w-full text-xs px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="rounded-lg border border-primary/20 bg-primary-light/20 p-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-secondary">
              AI can suggest triage fields and likely duplicates from this project’s bug database.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAnalyzeAI}
              isLoading={isAnalyzingAI}
              disabled={!currentProject || description.trim().length < 10}
            >
              Analyze with AI
            </Button>
          </div>
          {aiError && <p role="alert" className="text-xs text-red-700">{aiError}</p>}
          {aiAnalysis && (
            <div className="space-y-2 text-xs">
              <p className="font-medium text-navy-900">
                {aiAnalysis.suggested_title} · {aiAnalysis.category} · {aiAnalysis.severity} · {aiAnalysis.priority}
              </p>
              <p className="text-secondary">{aiAnalysis.rationale}</p>
              {aiAnalysis.duplicates.length > 0 && (
                <ul className="list-disc pl-5 text-secondary">
                  {aiAnalysis.duplicates.map((match) => (
                    <li key={match.bug_id}>
                      {match.bug_id}: {match.title} ({Math.round(match.similarity * 100)}% lexical similarity)
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted">Advisory only. Review before applying.</span>
                <Button type="button" size="sm" variant="secondary" onClick={applyAISuggestions}>
                  Apply suggestions
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-border flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            Log Defect
          </Button>
        </div>
      </form>
    </Modal>
  );
};
