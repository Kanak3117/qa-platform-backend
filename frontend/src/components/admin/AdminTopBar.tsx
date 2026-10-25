import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ShieldCheck, ChevronRight, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ProfileDropdown } from '../profile/ProfileDropdown';

interface AdminTopBarProps {
  onToggleSidebar?: () => void;
}

export const AdminTopBar: React.FC<AdminTopBarProps> = ({ onToggleSidebar }) => {
  const { user, currentProject } = useAuth();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('members')) return 'Access & Members';
    if (path.includes('roles')) return 'Roles & Permissions';
    if (path.includes('company')) return 'Company Profile';
    if (path.includes('invitations')) return 'Invitations';
    if (path.includes('audit-log')) return 'Audit Log';
    return 'Console Overview';
  };

  return (
    <header className="h-14 bg-surface border-b border-border px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden text-secondary hover:text-navy-900 p-1.5 rounded-lg hover:bg-soft transition-colors"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="flex items-center gap-1.5 text-xs">
          <Link to="/admin/members" className="font-semibold text-secondary hover:text-navy-900">
            DevValidate Admin
          </Link>
          <ChevronRight size={14} className="text-muted" />
          <span className="font-bold text-navy-900">{getPageTitle()}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-medium">
          <ShieldCheck size={14} />
          <span>RBAC Engine Online</span>
        </div>

        <div className="flex items-center gap-3 pl-3 border-l border-border">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-navy-900 leading-tight">
              {user?.name || 'Admin'}
            </div>
            <div className="text-[10px] text-muted">{currentProject?.name}</div>
          </div>
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
};
