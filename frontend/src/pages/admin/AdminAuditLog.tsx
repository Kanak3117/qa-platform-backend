import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Terminal, User as UserIcon } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { api } from '../../lib/api';
import { AuditLogEntry } from '../../types';

export const AdminAuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');

  const loadData = async () => {
    const list = await api.getAuditLog();
    setLogs(list);
    setFilteredLogs(list);
  };

  useEffect(() => {
    loadData();
    const unsub = api.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let result = [...logs];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.actor_name.toLowerCase().includes(q) ||
          l.actor_email.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q)
      );
    }
    if (entityFilter !== 'ALL') {
      result = result.filter((l) => l.entity === entityFilter);
    }
    setFilteredLogs(result);
  }, [search, entityFilter, logs]);

  const getActionBadge = (action: string) => {
    if (action.includes('CREATE')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (action.includes('STATUS')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (action.includes('REMOVE') || action.includes('CANCEL')) return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900">Audit Log</h1>
          <p className="text-xs text-secondary mt-1">
            Chronological security and quality activity trail across workspace entities.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.print()}
          className="print:hidden"
        >
          <Download size={14} /> Export Audit Trail
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
            placeholder="Search action, actor email, or detail keywords..."
            className="w-full text-xs bg-soft border border-border rounded-lg pl-9 pr-3 py-2 text-navy-900 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-secondary" />
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="text-xs bg-soft border border-border rounded-lg px-2.5 py-1.5 text-navy-900 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Entities</option>
            <option value="Bug">Bug / Defect</option>
            <option value="TestExecution">Test Execution</option>
            <option value="TestCase">Test Case</option>
            <option value="TestSuite">Test Suite</option>
            <option value="ProjectMember">Project Member</option>
            <option value="User">User</option>
            <option value="Invitation">Invitation</option>
            <option value="CompanyProfile">Company Profile</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table Card */}
      <div className="bg-surface rounded-card border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-soft/70 border-b border-border text-secondary uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-secondary">
                    No audit records match criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-soft transition-colors">
                    <td className="py-3 px-4 text-muted whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium text-navy-900">
                        <UserIcon size={13} className="text-secondary" />
                        <span>{log.actor_name}</span>
                      </div>
                      <div className="text-[10px] text-muted">{log.actor_email}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-secondary whitespace-nowrap font-medium">
                      {log.entity}
                    </td>
                    <td className="py-3 px-4 text-navy-900 max-w-md leading-relaxed">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 bg-soft/50 border-t border-border flex items-center justify-between text-xs text-secondary">
          <span>Showing {filteredLogs.length} activity records</span>
          <span className="flex items-center gap-1 font-mono text-[11px]">
            <Terminal size={12} /> Live Event Emitter Enabled
          </span>
        </div>
      </div>
    </div>
  );
};
