import React from 'react';
import { ShieldAlert, FlaskConical, Code2, Eye, Check, X } from 'lucide-react';

export const AdminRoles: React.FC = () => {
  const roles = [
    {
      title: 'System Administrator',
      backendRole: 'ADMIN',
      badge: 'SystemRole.ADMIN',
      description: 'Superuser with unrestricted access to team configuration, company security settings, and project provisioning.',
      icon: ShieldAlert,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      title: 'QA Tester / Engineer',
      backendRole: 'QA_ENGINEER',
      badge: 'ProjectRole.QA_ENGINEER',
      description: 'Primary quality guardian responsible for test suite curation, executing runs, triaging defects, and final retest sign-off.',
      icon: FlaskConical,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      title: 'Developer',
      backendRole: 'DEVELOPER',
      badge: 'ProjectRole.DEVELOPER',
      description: 'Engineering contributor focused on defect investigation, technical remediation, logs/traces, and submitting fixes.',
      icon: Code2,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      title: 'Stakeholder / Viewer',
      backendRole: 'STAKEHOLDER',
      badge: 'ProjectRole.STAKEHOLDER',
      description: 'Executive or client observer with view access to quality reports, release readiness metrics, and audit history.',
      icon: Eye,
      color: 'bg-gray-100 text-gray-700 border-gray-200',
    },
  ];

  const permissions = [
    { capability: 'View Overview & Project Health', qa: true, dev: true, admin: true, stakeholder: true },
    { capability: 'Author & Edit Test Suites', qa: true, dev: false, admin: true, stakeholder: false },
    { capability: 'Author & Maintain Test Cases', qa: true, dev: false, admin: true, stakeholder: false },
    { capability: 'Execute Test Cases & Runs', qa: true, dev: false, admin: true, stakeholder: false },
    { capability: 'Log Defects & Upload Logs', qa: true, dev: true, admin: true, stakeholder: false },
    { capability: 'Transition Defect to "In Progress"', qa: true, dev: true, admin: true, stakeholder: false },
    { capability: 'Mark Defect as "Fixed"', qa: false, dev: true, admin: true, stakeholder: false },
    { capability: 'Verify & Close Defect (Retest)', qa: true, dev: false, admin: true, stakeholder: false },
    { capability: 'Reopen Unresolved Defect', qa: true, dev: false, admin: true, stakeholder: false },
    { capability: 'Apply AI Bug Intelligence Recommendations', qa: true, dev: true, admin: true, stakeholder: false },
    { capability: 'Access Admin Console', qa: false, dev: false, admin: true, stakeholder: false },
    { capability: 'Invite & Deactivate Members', qa: false, dev: false, admin: true, stakeholder: false },
    { capability: 'Configure Company Profile & Security', qa: false, dev: false, admin: true, stakeholder: false },
    { capability: 'View Organization Audit Log', qa: false, dev: false, admin: true, stakeholder: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-900">Roles & Permissions</h1>
        <p className="text-xs text-secondary mt-1">
          System-wide and project-level role capabilities and authorization boundaries.
        </p>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((r) => {
          const Icon = r.icon;
          return (
            <div
              key={r.title}
              className="bg-surface rounded-card border border-border p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-lg border ${r.color}`}>
                    <Icon size={18} />
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-soft text-secondary border border-border">
                    {r.backendRole}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-navy-900">{r.title}</h3>
                <p className="text-xs text-secondary mt-1.5 leading-relaxed">{r.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 text-[11px] font-mono text-muted">
                {r.badge}
              </div>
            </div>
          );
        })}
      </div>

      {/* Permission Capability Matrix Card */}
      <div className="bg-surface rounded-card border border-border shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-navy-900">Capability Matrix</h3>
            <p className="text-xs text-secondary mt-0.5">
              Defines operational privileges across workflows in the Dailoqa platform
            </p>
          </div>
          <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-medium">
            FastAPI Auth Enforced
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-soft/70 border-b border-border text-secondary uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Feature & Operation</th>
                <th className="py-3 px-4 text-center">QA Tester</th>
                <th className="py-3 px-4 text-center">Developer</th>
                <th className="py-3 px-4 text-center">Admin</th>
                <th className="py-3 px-4 text-center">Stakeholder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {permissions.map((p, idx) => (
                <tr key={idx} className="hover:bg-soft transition-colors">
                  <td className="py-3 px-4 font-medium text-navy-900">{p.capability}</td>
                  <td className="py-3 px-4 text-center">
                    {p.qa ? (
                      <span className="inline-flex p-1 rounded-full bg-emerald-50 text-emerald-600">
                        <Check size={14} />
                      </span>
                    ) : (
                      <span className="inline-flex p-1 rounded-full bg-gray-50 text-gray-300">
                        <X size={14} />
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {p.dev ? (
                      <span className="inline-flex p-1 rounded-full bg-emerald-50 text-emerald-600">
                        <Check size={14} />
                      </span>
                    ) : (
                      <span className="inline-flex p-1 rounded-full bg-gray-50 text-gray-300">
                        <X size={14} />
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {p.admin ? (
                      <span className="inline-flex p-1 rounded-full bg-emerald-50 text-emerald-600">
                        <Check size={14} />
                      </span>
                    ) : (
                      <span className="inline-flex p-1 rounded-full bg-gray-50 text-gray-300">
                        <X size={14} />
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {p.stakeholder ? (
                      <span className="inline-flex p-1 rounded-full bg-emerald-50 text-emerald-600">
                        <Check size={14} />
                      </span>
                    ) : (
                      <span className="inline-flex p-1 rounded-full bg-gray-50 text-gray-300">
                        <X size={14} />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
