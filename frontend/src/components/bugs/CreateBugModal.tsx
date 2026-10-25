import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Bug, BugSeverity, TestCase, User } from '../../types';
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getTestCases(undefined, currentProject?.id).then((cases) => {
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
  }, [isOpen, initialTestCaseId, currentProject?.id]);

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
          <div className="p-3 badge-failed border rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block font-semibold text-navy-900 mb-1">Bug Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Checkout fails on expired card with unhandled exception"
            className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-surface text-navy-900 focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-navy-900 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-surface text-navy-900 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="Payment / Checkout">Payment / Checkout</option>
              <option value="Authentication">Authentication</option>
              <option value="Performance">Performance</option>
              <option value="UI / UX">UI / UX</option>
              <option value="API / Backend">API / Backend</option>
              <option value="Security">Security</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Related Test Case</label>
            <select
              value={testCaseId}
              onChange={(e) => setTestCaseId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-surface text-navy-900 focus:outline-none focus:ring-1 focus:ring-primary truncate"
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
              className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-surface text-navy-900 focus:outline-none focus:ring-1 focus:ring-primary"
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
              className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-surface text-navy-900 focus:outline-none focus:ring-1 focus:ring-primary"
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
              className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-surface text-navy-900 focus:outline-none focus:ring-1 focus:ring-primary"
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
            className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-surface text-navy-900 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block font-semibold text-navy-900 mb-1">Description & Steps to Reproduce</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of defect, steps to reproduce, actual vs expected result..."
            className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-surface text-navy-900 focus:outline-none focus:ring-1 focus:ring-primary"
          />
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
