import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Sun, Moon, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { EditProfileModal } from './EditProfileModal';

export const ProfileDropdown: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/login');
  };

  const getRoleLabel = () => {
    if (user?.system_role === 'ADMIN') return 'System Administrator';
    if (user?.project_role === 'DEVELOPER') return 'Developer Tester';
    if (user?.project_role === 'QA_ENGINEER') return 'QA Engineer';
    if (user?.project_role === 'STAKEHOLDER') return 'Product Stakeholder';
    return user?.system_role || 'Workspace User';
  };

  const getInitials = () => {
    if (!user?.name) return 'DV';
    const parts = user.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="User Profile Menu"
          className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-primary/40 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-primary text-white font-semibold flex items-center justify-center text-xs shadow-xs">
            {getInitials()}
          </div>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-surface border border-border rounded-xl shadow-xl py-2 z-50 text-navy-900 animate-in fade-in-50 zoom-in-95 duration-100">
            {/* User Header */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                  {getInitials()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-navy-900 truncate leading-snug">
                    {user?.name || 'DevValidate User'}
                  </p>
                  <p className="text-[11px] text-muted truncate">
                    {user?.email || 'user@dailoqa.io'}
                  </p>
                </div>
              </div>
              <div className="mt-2.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-primary-light text-primary border border-primary/20">
                  {getRoleLabel()}
                </span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsEditModalOpen(true);
                }}
                className="w-full text-left px-4 py-2 text-xs text-navy-900 hover:bg-soft flex items-center gap-2.5 transition-colors"
              >
                <UserIcon size={15} className="text-secondary" />
                <span>Edit Profile</span>
              </button>

              {/* Sliding Theme Switch Item */}
              <div
                className="px-4 py-2 text-xs text-navy-900 hover:bg-soft flex items-center justify-between transition-colors select-none cursor-pointer"
                onClick={() => toggleTheme()}
              >
                <div className="flex items-center gap-2.5">
                  {theme === 'dark' ? (
                    <Moon size={15} className="text-indigo-400" />
                  ) : (
                    <Sun size={15} className="text-amber-500" />
                  )}
                  <span className="font-medium text-navy-900">Dark mode</span>
                </div>
                {/* iOS-style sliding switch */}
                <div
                  role="switch"
                  aria-checked={theme === 'dark'}
                  aria-label="Toggle dark mode"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      toggleTheme();
                    }
                  }}
                  className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
                    theme === 'dark' ? 'bg-[#4F46E5]' : 'bg-[#D1D5DB]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Sign Out */}
            <div className="pt-1 border-t border-border">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 transition-colors font-medium"
              >
                <LogOut size={15} className="text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  );
};
