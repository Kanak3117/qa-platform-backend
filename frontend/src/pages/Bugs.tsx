import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, AlertCircle } from 'lucide-react';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { CreateBugModal } from '../components/bugs/CreateBugModal';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Bug } from '../types';
import { MOCK_USERS } from '../lib/mockData';

export const Bugs: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject } = useAuth();
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [filteredBugs, setFilteredBugs] = useState<Bug[]>([]);
  const [isLogBugOpen, setIsLogBugOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const loadData = () => {
    api.getBugs(currentProject?.id).then((data) => {
      setBugs(data);
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
    let result = [...bugs];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.bug_code.toLowerCase().includes(q) ||
          b.title.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'ALL') {
      result = result.filter((b) => b.status === statusFilter);
    }

    if (severityFilter !== 'ALL') {
      result = result.filter((b) => b.severity === severityFilter);
    }

    setFilteredBugs(result);
  }, [search, statusFilter, severityFilter, bugs]);

  const getUserName = (id?: string | null) => {
    if (!id) return 'Unassigned';
    return MOCK_USERS.find((u) => u.id === id)?.name || 'QA Team';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-navy-900">Bugs</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary-light text-primary border border-primary/20">
              {currentProject?.name || 'Active Project'}
            </span>
          </div>
          <p className="text-xs text-secondary mt-1">
            Track, triage and resolve defects in {currentProject?.name}.
          </p>
        </div>
        <Button onClick={() => setIsLogBugOpen(true)} size="md">
          <Plus size={16} /> Log Bug
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface rounded-card border border-border p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-2.5 text-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bug code, title, or category..."
            className="w-full text-xs bg-soft border border-border rounded-lg pl-9 pr-3 py-2 text-navy-900 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-secondary font-medium">
            <Filter size={14} /> Filters:
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-soft border border-border rounded-lg px-2.5 py-1.5 text-navy-900 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Fixed">Fixed</option>
            <option value="Retest">Retest</option>
            <option value="Closed">Closed</option>
            <option value="Reopened">Reopened</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs bg-soft border border-border rounded-lg px-2.5 py-1.5 text-navy-900 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
            <option value="Informational">Informational</option>
          </select>
        </div>
      </div>

      {/* Bug Table Card */}
      <div className="bg-surface rounded-card border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-soft/70 border-b border-border text-secondary uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Bug ID</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredBugs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-secondary">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle size={24} className="text-muted mb-2" />
                      <span>No bugs match your active filter criteria.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBugs.map((bug) => (
                  <tr
                    key={bug.id}
                    onClick={() => navigate(`/bugs/${bug.id}`)}
                    className="hover:bg-soft cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 font-semibold text-primary group-hover:underline whitespace-nowrap">
                      {bug.bug_code}
                    </td>
                    <td className="py-3 px-4 font-medium text-navy-900 max-w-xs truncate">
                      {bug.title}
                    </td>
                    <td className="py-3 px-4 text-secondary whitespace-nowrap">
                      {bug.category}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <SeverityBadge severity={bug.severity} size="sm" />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <PriorityBadge priority={bug.priority} size="sm" />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={bug.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-secondary whitespace-nowrap">
                      {getUserName(bug.assignee_id)}
                    </td>
                    <td className="py-3 px-4 text-muted whitespace-nowrap">
                      {bug.due_date || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="px-4 py-3 bg-soft/50 border-t border-border flex items-center justify-between text-xs text-secondary">
          <span>Showing {filteredBugs.length} of {bugs.length} total bugs</span>
          <span>Click any row to view AI analysis, status lifecycle & comments</span>
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
