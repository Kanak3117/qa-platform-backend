import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShieldAlert,
  Code2,
  FlaskConical,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { MetricCard } from '../../components/common/MetricCard';
import { Modal } from '../../components/common/Modal';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { User, ProjectMember, SystemRole, ProjectRole } from '../../types';

export const AdminMembers: React.FC = () => {
  const { currentProject, user: currentUser, refreshCurrentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Invite form fields
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteSystemRole, setInviteSystemRole] = useState<SystemRole>('USER');
  const [inviteProjectRole, setInviteProjectRole] = useState<ProjectRole>('QA_ENGINEER');
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  // Edit role fields
  const [editSystemRole, setEditSystemRole] = useState<SystemRole>('USER');
  const [editProjectRole, setEditProjectRole] = useState<ProjectRole>('QA_ENGINEER');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const loadData = async () => {
    const fetchedUsers = await api.listUsers();
    setUsers(fetchedUsers);
    if (currentProject) {
      const fetchedMembers = await api.listProjectMembers(currentProject.id);
      setProjectMembers(fetchedMembers);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = api.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [currentProject]);

  const handleToggleActive = async (u: User) => {
    if (u.id === currentUser?.id) {
      alert('You cannot deactivate your own account.');
      return;
    }
    const newActive = !u.active;
    await api.updateUser(u.id, { active: newActive });
  };

  const handleOpenEdit = (u: User) => {
    setSelectedUser(u);
    setEditSystemRole(u.system_role);
    const member = projectMembers.find((pm) => pm.user_id === u.id);
    setEditProjectRole(member ? member.project_role : u.project_role || 'QA_ENGINEER');
    setIsEditRoleOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmittingEdit(true);
    try {
      await api.updateUser(selectedUser.id, { system_role: editSystemRole });
      if (currentProject) {
        const existingMember = projectMembers.find((pm) => pm.user_id === selectedUser.id);
        if (existingMember) {
          await api.updateProjectMember(currentProject.id, existingMember.id, editProjectRole);
        } else {
          await api.addProjectMember(currentProject.id, selectedUser.id, editProjectRole);
        }
      }
      if (selectedUser.id === currentUser?.id) {
        await refreshCurrentUser();
      }
      await loadData();
      setIsEditRoleOpen(false);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsSubmittingInvite(true);
    try {
      // 1. Send invitation record
      await api.sendInvitation(inviteEmail, inviteProjectRole, currentUser?.name || 'Admin');
      // 2. Register / Provision user in organization (defaults to USER)
      const registered = await api.register(
        inviteName || inviteEmail.split('@')[0],
        inviteEmail,
        'TempPass123!',
        inviteProjectRole
      );
      // 3. If admin explicitly promotes them to ADMIN, apply system role update
      if (inviteSystemRole === 'ADMIN') {
        await api.updateUser(registered.id, { system_role: 'ADMIN' });
      }
      await loadData();
      setIsInviteOpen(false);
      setInviteEmail('');
      setInviteName('');
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  // Metrics calculation
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.system_role === 'ADMIN').length;
  const qaCount = projectMembers.filter((m) => m.project_role === 'QA_ENGINEER').length;
  const devCount = projectMembers.filter((m) => m.project_role === 'DEVELOPER').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900">Access & Members</h1>
          <p className="text-xs text-secondary mt-1">
            Manage organization seats, role assignments, and project authorization.
          </p>
        </div>
        <Button onClick={() => setIsInviteOpen(true)} size="md">
          <UserPlus size={16} /> Invite Member
        </Button>
      </div>

      {/* Top 4 Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Members"
          value={totalUsers}
          subtext="Active in organization"
          subtextColor="gray"
          icon={<Users size={18} />}
        />
        <MetricCard
          label="System Admins"
          value={adminCount}
          subtext="Full privileges"
          subtextColor="purple"
          icon={<ShieldAlert size={18} />}
        />
        <MetricCard
          label="QA Testers / Engineers"
          value={qaCount}
          subtext="Authoring & verification"
          subtextColor="green"
          icon={<FlaskConical size={18} />}
        />
        <MetricCard
          label="Developers"
          value={devCount}
          subtext="Defect remediation"
          subtextColor="gray"
          icon={<Code2 size={18} />}
        />
      </div>

      {/* Role Overview Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-border shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-700">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-navy-900">Admin</h4>
              <p className="text-[11px] text-secondary">Organization & workspace security</p>
            </div>
          </div>
          <span className="text-lg font-bold text-navy-900">{adminCount}</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
              <FlaskConical size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-navy-900">QA Tester</h4>
              <p className="text-[11px] text-secondary">Backend role: QA_ENGINEER</p>
            </div>
          </div>
          <span className="text-lg font-bold text-navy-900">{qaCount}</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-700">
              <Code2 size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-navy-900">Developer</h4>
              <p className="text-[11px] text-secondary">Defect remediation & fixes</p>
            </div>
          </div>
          <span className="text-lg font-bold text-navy-900">{devCount}</span>
        </div>
      </div>

      {/* Members Table Card */}
      <div className="bg-surface rounded-card border border-border shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-navy-900">Team Directory</h3>
            <p className="text-xs text-secondary mt-0.5">
              Configured users with project permissions for {currentProject?.name}
            </p>
          </div>
          <span className="text-xs text-muted">{users.length} members configured</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-soft/70 border-b border-border text-secondary uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">System Role</th>
                <th className="py-3 px-4">Project Role</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => {
                const member = projectMembers.find((pm) => pm.user_id === u.id);
                const projRole = member ? member.project_role : u.project_role || 'QA_ENGINEER';

                return (
                  <tr key={u.id} className="hover:bg-soft transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-navy-900">{u.name}</div>
                          <div className="text-[11px] text-muted">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          u.system_role === 'ADMIN'
                            ? 'badge-retest'
                            : 'badge-low'
                        }`}
                      >
                        {u.system_role}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-medium text-navy-800 bg-soft border border-border px-2 py-0.5 rounded text-[11px]">
                        {projRole === 'QA_ENGINEER' ? 'QA Tester' : projRole}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                          u.active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {u.active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {u.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="text-primary hover:underline font-semibold text-xs"
                        >
                          Edit Role
                        </button>
                        <span className="text-border">|</span>
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={u.id === currentUser?.id}
                          className={`text-xs font-medium ${
                            u.active
                              ? 'text-rose-600 hover:underline disabled:opacity-30'
                              : 'text-emerald-600 hover:underline'
                          }`}
                        >
                          {u.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite Team Member" maxWidth="md">
        <form onSubmit={handleSendInvite} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-navy-900 mb-1">Full Name</label>
            <input
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="e.g. Jordan Lee"
              className="w-full text-xs px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Work Email *</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              placeholder="jordan.lee@company.com"
              className="w-full text-xs px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Project Role</label>
              <select
                value={inviteProjectRole}
                onChange={(e) => setInviteProjectRole(e.target.value as ProjectRole)}
                className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-surface text-navy-900 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="QA_ENGINEER">QA Tester (QA Engineer)</option>
                <option value="DEVELOPER">Developer</option>
                <option value="STAKEHOLDER">Stakeholder</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-navy-900 mb-1">System Role</label>
              <select
                value={inviteSystemRole}
                onChange={(e) => setInviteSystemRole(e.target.value as SystemRole)}
                className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-surface text-navy-900 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="USER">Standard User</option>
                <option value="ADMIN">System Administrator</option>
              </select>
            </div>
          </div>

          <p className="text-[11px] text-secondary">
            Invited members will receive email instructions with credentials to sign in and begin triage on {currentProject?.name}.
          </p>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmittingInvite}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal isOpen={isEditRoleOpen} onClose={() => setIsEditRoleOpen(false)} title="Update Member Role" maxWidth="md">
        <form onSubmit={handleSaveRole} className="space-y-4 text-xs">
          <div>
            <span className="text-secondary block mb-1">Configuring permissions for:</span>
            <div className="font-bold text-navy-900 text-sm">{selectedUser?.name} ({selectedUser?.email})</div>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">System Role</label>
            <select
              value={editSystemRole}
              onChange={(e) => setEditSystemRole(e.target.value as SystemRole)}
              className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-surface text-navy-900 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="USER">Standard User</option>
              <option value="ADMIN">System Administrator</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-navy-900 mb-1">Project Role ({currentProject?.name})</label>
            <select
              value={editProjectRole}
              onChange={(e) => setEditProjectRole(e.target.value as ProjectRole)}
              className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-surface text-navy-900 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="QA_ENGINEER">QA Tester (QA Engineer)</option>
              <option value="DEVELOPER">Developer</option>
              <option value="STAKEHOLDER">Stakeholder</option>
            </select>
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditRoleOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmittingEdit}>
              Save Role Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
