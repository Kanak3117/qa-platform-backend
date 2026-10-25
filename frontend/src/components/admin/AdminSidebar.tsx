import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  Building2,
  Mail,
  History,
  ArrowLeft,
  LogOut,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Access & Members', to: '/admin/members', icon: Users },
    { name: 'Roles & Permissions', to: '/admin/roles', icon: ShieldCheck },
    { name: 'Company Profile', to: '/admin/company', icon: Building2 },
    { name: 'Invitations', to: '/admin/invitations', icon: Mail },
    { name: 'Audit Log', to: '/admin/audit-log', icon: History },
  ];

  return (
    <aside className="w-60 min-w-[240px] bg-surface border-r border-border h-screen flex flex-col justify-between shrink-0 select-none">
      <div className="flex flex-col">
        {/* Brand header */}
        <div className="px-5 py-5 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-navy-900 text-white flex items-center justify-center font-bold text-base shadow-sm">
              <ShieldAlert size={18} className="text-amber-400" />
            </div>
            <div>
              <div className="font-bold text-navy-900 text-base leading-tight tracking-tight">Dailoqa</div>
              <div className="text-[11px] text-primary font-semibold flex items-center gap-1">
                Admin Console
              </div>
            </div>
          </div>
        </div>

        {/* Back to QA Workspace link */}
        <div className="px-3 pt-3 pb-1">
          <NavLink
            to="/workspace"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-secondary hover:text-navy-900 hover:bg-soft transition-all"
          >
            <ArrowLeft size={14} /> Back to QA Workspace
          </NavLink>
        </div>

        {/* Admin Navigation */}
        <nav className="px-3 py-2 space-y-1">
          <div className="text-[11px] font-semibold text-muted uppercase tracking-wider px-2 py-1">
            Administration
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary-light text-primary font-semibold'
                      : 'text-secondary hover:text-navy-900 hover:bg-soft'
                  }`
                }
              >
                <Icon size={18} className="shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Admin User info & Logout at bottom */}
      <div className="p-3 border-t border-border bg-soft/50">
        <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border/60">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-navy-900 text-white font-semibold flex items-center justify-center text-xs shrink-0">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-navy-900 truncate">
                {user?.name || 'Administrator'}
              </div>
              <div className="text-[11px] text-primary font-medium truncate">
                SYSTEM ADMIN
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="text-secondary hover:text-red-600 p-1 rounded-md hover:bg-gray-100 transition-colors shrink-0"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
