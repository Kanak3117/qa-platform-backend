import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  ListTodo,
  PlayCircle,
  Bug,
  BarChart3,
  FlaskConical,
  Code2,
  LogOut,
  Layers,
  ChevronDown,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, logout, currentProject, projects, setCurrentProject } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Overview', to: '/workspace', icon: LayoutDashboard },
    { name: 'Test Suites', to: '/test-suites', icon: FolderGit2 },
    { name: 'Test Cases', to: '/test-cases', icon: ListTodo },
    { name: 'Test Runs', to: '/test-runs', icon: PlayCircle },
    { name: 'Bugs', to: '/bugs', icon: Bug },
    { name: 'Reports', to: '/reports', icon: BarChart3 },
  ];

  const roleWorkspaces = [
    { name: 'QA Tester View', to: '/qa-workspace', icon: FlaskConical },
    { name: 'Developer View', to: '/developer-workspace', icon: Code2 },
  ];

  return (
    <aside className="w-60 min-w-[240px] bg-surface border-r border-border h-screen flex flex-col justify-between shrink-0 select-none">
      <div className="flex flex-col">
        {/* Brand header */}
        <div className="px-5 py-5 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-base shadow-sm">
              <Bug size={18} />
            </div>
            <div>
              <div className="font-bold text-navy-900 text-base leading-tight tracking-tight">Dailoqa</div>
              <div className="text-xs text-secondary font-medium">QA Workspace</div>
            </div>
          </div>
        </div>

        {/* Project Selector */}
        <div className="px-3 pt-4 pb-2">
          <div className="text-[11px] font-semibold text-muted uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1.5">
            <Layers size={12} /> Active Project
          </div>
          <div className="relative group">
            <select
              aria-label="Active Project"
              value={currentProject?.id || ''}
              onChange={(e) => {
                const selected = projects.find(p => p.id === e.target.value);
                if (selected) setCurrentProject(selected);
              }}
              className="w-full appearance-none bg-soft hover:bg-gray-100 border border-border text-navy-900 text-xs font-medium rounded-lg px-2.5 py-2 pr-7 cursor-pointer transition-colors focus:outline-none focus:ring-1 focus:ring-primary truncate"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-secondary pointer-events-none" />
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="px-3 py-2 space-y-1">
          <div className="text-[11px] font-semibold text-muted uppercase tracking-wider px-2 py-1">
            Menu
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

          {user?.system_role === 'ADMIN' && (
            <NavLink
              to="/admin/members"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-purple-100 text-purple-700 font-semibold'
                    : 'text-purple-700 hover:bg-purple-50 font-semibold'
                }`
              }
            >
              <ShieldAlert size={18} className="shrink-0 text-purple-600" />
              <span>Admin Console</span>
            </NavLink>
          )}
        </nav>

        {/* Role Specific Views */}
        <div className="px-3 py-2 space-y-1">
          <div className="text-[11px] font-semibold text-muted uppercase tracking-wider px-2 py-1">
            Workspaces
          </div>
          {roleWorkspaces.map((item) => {
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
        </div>
      </div>

      {/* User info & Logout at bottom */}
      <div className="p-3 border-t border-border bg-soft/50">
        <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border/60">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-xs shrink-0">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'QA'}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-navy-900 truncate">
                {user?.name || 'User'}
              </div>
              <div className="text-[11px] text-secondary truncate">
                {user?.system_role || 'QA_ENGINEER'}
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
