import React, { useState, useEffect } from 'react';
import { Building2, Shield, CheckCircle2, Save, Info } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { api } from '../../lib/api';
import { CompanyProfile } from '../../types';

export const AdminCompany: React.FC = () => {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api.getCompanyProfile().then(setProfile);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSaving(true);
    try {
      const res = await api.saveCompanyProfile(profile);
      if (res.isLocalMvp) {
        setNotice('Company settings saved to local workspace session.');
      } else {
        setNotice('Settings saved.');
      }
      setTimeout(() => setNotice(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) {
    return <div className="py-12 text-center text-xs text-secondary">Loading profile...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-900">Company Profile</h1>
        <p className="text-xs text-secondary mt-1">
          Workspace branding, domain settings, and enterprise security policies.
        </p>
      </div>

      {notice && (
        <div className="p-3.5 badge-passed rounded-xl text-xs flex items-center justify-between border">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{notice}</span>
          </div>
          <span className="text-[11px] bg-surface/80 px-2 py-0.5 rounded font-mono border">
            MVP Local Persistence
          </span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Workspace Identity Card */}
        <div className="bg-surface rounded-card border border-border p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-4 border-b border-border">
            <Building2 size={18} className="text-primary" />
            <div>
              <h3 className="text-sm font-semibold text-navy-900">Organization Identity</h3>
              <p className="text-xs text-secondary">Public branding and workspace coordinates</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">Company Legal Name</label>
              <input
                type="text"
                value={profile.company_name}
                onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-border rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-navy-900 mb-1">Official Website</label>
              <input
                type="url"
                value={profile.website}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-border rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-navy-900 mb-1">Dedicated Workspace URL</label>
              <input
                type="text"
                value={profile.workspace_url}
                onChange={(e) => setProfile({ ...profile, workspace_url: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-soft font-mono focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-navy-900 mb-1">Industry Vertical</label>
              <select
                value={profile.industry}
                onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-surface text-navy-900 focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="Enterprise Software / Quality Engineering">Enterprise Software / Quality Engineering</option>
                <option value="Fintech & Payments">Fintech & Payments</option>
                <option value="E-Commerce & Logistics">E-Commerce & Logistics</option>
                <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-navy-900 mb-1">Team Engineering Size</label>
              <select
                value={profile.team_size}
                onChange={(e) => setProfile({ ...profile, team_size: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-surface text-navy-900 focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="1-10 engineers">1-10 engineers</option>
                <option value="10-50 engineers">10-50 engineers</option>
                <option value="50-100 engineers">50-100 engineers</option>
                <option value="100+ engineers">100+ engineers</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security & Access Policies Card */}
        <div className="bg-surface rounded-card border border-border p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-4 border-b border-border">
            <Shield size={18} className="text-primary" />
            <div>
              <h3 className="text-sm font-semibold text-navy-900">Security & Authentication Policies</h3>
              <p className="text-xs text-secondary">Compliance and access controls across the organization</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.sso_enforced}
                onChange={(e) => setProfile({ ...profile, sso_enforced: e.target.checked })}
                className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4 border-gray-300"
              />
              <div>
                <span className="font-semibold text-navy-900 block">Enforce Single Sign-On (SAML / OIDC)</span>
                <span className="text-secondary text-[11px]">
                  Require all organization members to authenticate through corporate identity provider.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.two_factor_required}
                onChange={(e) => setProfile({ ...profile, two_factor_required: e.target.checked })}
                className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4 border-gray-300"
              />
              <div>
                <span className="font-semibold text-navy-900 block">Mandatory Two-Factor Authentication (2FA)</span>
                <span className="text-secondary text-[11px]">
                  Require hardware keys or authenticator apps for all users with project roles.
                </span>
              </div>
            </label>

            <div className="pt-2 max-w-xs">
              <label className="block font-semibold text-navy-900 mb-1">Inactive Session Inactivity Timeout</label>
              <select
                value={profile.session_timeout_minutes}
                onChange={(e) => setProfile({ ...profile, session_timeout_minutes: Number(e.target.value) })}
                className="w-full text-xs px-3 py-2 border border-border rounded-lg bg-surface text-navy-900 focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes (Standard)</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer info note & Save CTA */}
        <div className="p-3 bg-soft border border-border rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-secondary">
            <Info size={16} className="text-primary shrink-0" />
            <span>Profile and security adjustments are preserved in active workspace session storage.</span>
          </div>
          <Button type="submit" size="md" isLoading={isSaving}>
            <Save size={16} /> Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};
