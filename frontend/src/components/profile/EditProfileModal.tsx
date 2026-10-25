import React, { useState, useEffect } from 'react';
import { User, Lock, Mail, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, refreshCurrentUser, updateUserContext } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setErrorMsg('Full name is required.');
      return;
    }

    if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) {
        setErrorMsg('Please enter your current password to set a new password.');
        return;
      }
      if (newPassword.length < 8) {
        setErrorMsg('New password must be at least 8 characters in length.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('New password and confirmation do not match.');
        return;
      }
    }

    setIsLoading(true);
    try {
      const payload: {
        name?: string;
        email?: string;
        currentPassword?: string;
        newPassword?: string;
      } = {};

      if (trimmedName !== user?.name) {
        payload.name = trimmedName;
      }
      if (trimmedEmail !== user?.email?.toLowerCase()) {
        payload.email = trimmedEmail;
      }
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      // If nothing was altered
      if (Object.keys(payload).length === 0) {
        setErrorMsg('No changes detected.');
        setIsLoading(false);
        return;
      }

      const updatedUser = await api.updateProfile(payload);
      updateUserContext(updatedUser);
      await refreshCurrentUser();

      setSuccessMsg('Your profile has been successfully updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-surface border border-border rounded-xl shadow-xl overflow-hidden transition-all text-navy-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-navy-900 tracking-tight">Edit Profile</h2>
            <p className="text-xs text-secondary mt-0.5">Manage your personal account credentials.</p>
          </div>
          <button
            onClick={onClose}
            className="text-secondary hover:text-navy-900 p-1.5 rounded-lg hover:bg-soft transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs badge-failed border rounded-lg flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 text-xs badge-passed border rounded-lg flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-navy-900 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-2.5 text-muted pointer-events-none" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
                className="w-full text-xs bg-soft border border-border rounded-lg pl-9 pr-3 py-2 text-navy-900 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface transition-colors"
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-xs font-semibold text-navy-900 mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-2.5 text-muted pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full text-xs bg-soft border border-border rounded-lg pl-9 pr-3 py-2 text-navy-900 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface transition-colors"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <span className="block text-xs font-bold text-navy-900 mb-1">Change Password</span>
            <span className="block text-[11px] text-muted mb-3">Leave blank if you wish to keep your current password.</span>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-secondary mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-2.5 text-muted pointer-events-none" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full text-xs bg-soft border border-border rounded-lg pl-9 pr-3 py-2 text-navy-900 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-secondary mb-1">
                  New Password (min 8 characters)
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-2.5 text-muted pointer-events-none" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New strong password"
                    className="w-full text-xs bg-soft border border-border rounded-lg pl-9 pr-3 py-2 text-navy-900 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-secondary mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-2.5 text-muted pointer-events-none" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full text-xs bg-soft border border-border rounded-lg pl-9 pr-3 py-2 text-navy-900 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isLoading}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
