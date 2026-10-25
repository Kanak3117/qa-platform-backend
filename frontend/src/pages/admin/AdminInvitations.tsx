import React, { useState, useEffect } from 'react';
import { UserPlus, RefreshCw, XCircle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { MetricCard } from '../../components/common/MetricCard';
import { Modal } from '../../components/common/Modal';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Invitation, ProjectRole } from '../../types';

export const AdminInvitations: React.FC = () => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ProjectRole>('QA_ENGINEER');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    const list = await api.getInvitations();
    setInvitations([...list]);
  };

  useEffect(() => {
    loadData();
    const unsub = api.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    try {
      await api.sendInvitation(email, role, user?.name || 'Elena Rostova');
      setIsInviteOpen(false);
      setEmail('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    await api.cancelInvitation(id);
  };

  const handleResend = async (id: string) => {
    await api.resendInvitation(id);
  };

  const pendingCount = invitations.filter((i) => i.status === 'Pending').length;
  const acceptedCount = invitations.filter((i) => i.status === 'Accepted').length;
  const expiredCount = invitations.filter((i) => i.status === 'Expired' || i.status === 'Cancelled').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900">Invitations</h1>
          <p className="text-xs text-secondary mt-1">
            Pending and active organization access invites with role assignments.
          </p>
        </div>
        <Button onClick={() => setIsInviteOpen(true)} size="md">
          <UserPlus size={16} /> Send Invitation
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Pending Invitations"
          value={pendingCount}
          subtext="Awaiting member acceptance"
          subtextColor="purple"
          icon={<Clock size={18} />}
        />
        <MetricCard
          label="Accepted Seats"
          value={acceptedCount}
          subtext="Successfully joined organization"
          subtextColor="green"
          icon={<CheckCircle2 size={18} />}
        />
        <MetricCard
          label="Expired or Revoked"
          value={expiredCount}
          subtext="Requires re-invitation"
          subtextColor="gray"
          icon={<XCircle size={18} />}
        />
      </div>

      {/* Invitations Table Card */}
      <div className="bg-surface rounded-card border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-soft/70 border-b border-border text-secondary uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Recipient Email</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Sent Date</th>
                <th className="py-3 px-4">Invited By</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invitations.map((inv) => (
                <tr key={inv.id} className="hover:bg-soft transition-colors">
                  <td className="py-3 px-4 font-semibold text-navy-900 whitespace-nowrap">
                    {inv.email}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-medium badge-low px-2 py-0.5 rounded text-[11px] border">
                      {inv.role === 'QA_ENGINEER' ? 'QA Tester' : inv.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
                        inv.status === 'Pending'
                          ? 'badge-high'
                          : inv.status === 'Accepted'
                          ? 'badge-passed'
                          : 'badge-low'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-secondary whitespace-nowrap">
                    {new Date(inv.sent_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-4 text-muted whitespace-nowrap">
                    {inv.invited_by}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {inv.status === 'Pending' ? (
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleResend(inv.id)}
                          className="text-primary hover:underline font-semibold text-xs inline-flex items-center gap-1"
                        >
                          <RefreshCw size={12} /> Resend
                        </button>
                        <span className="text-border">|</span>
                        <button
                          onClick={() => handleCancel(inv.id)}
                          className="text-rose-600 hover:underline font-medium text-xs inline-flex items-center gap-1"
                        >
                          <XCircle size={12} /> Revoke
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleResend(inv.id)}
                        className="text-primary hover:underline font-medium text-xs"
                      >
                        Re-invite
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Send Organization Invitation" maxWidth="md">
        <form onSubmit={handleSend} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-navy-900 mb-1">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="engineer@company.com"
              className="w-full text-xs px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Assigned Role *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as ProjectRole)}
              className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-surface text-navy-900 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="QA_ENGINEER">QA Tester (QA Engineer)</option>
              <option value="DEVELOPER">Developer</option>
              <option value="STAKEHOLDER">Stakeholder</option>
            </select>
          </div>

          <p className="text-[11px] text-secondary">
            An invite email will be dispatched immediately. The recipient will be granted active project workspace access.
          </p>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
