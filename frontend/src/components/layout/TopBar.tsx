import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Notification } from '../../types';
import { GlobalSearch } from '../search/GlobalSearch';
import { ProfileDropdown } from '../profile/ProfileDropdown';

interface TopBarProps {
  onToggleSidebar?: () => void;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (isNaN(diffInSeconds) || diffInSeconds < 0 || diffInSeconds < 60) {
    return 'Just now';
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return 'Yesterday';
  }
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getNotificationRoute(message: string): string {
  const bugMatch = message.match(/(?:DEV-)?BUG-\d+/i);
  if (bugMatch) {
    return '/bugs';
  }
  const lower = message.toLowerCase();
  if (lower.includes('bug') || lower.includes('defect')) {
    return '/bugs';
  }
  if (lower.includes('test run') || lower.includes('suite')) {
    return '/test-runs';
  }
  if (lower.includes('test execution') || lower.includes('test case')) {
    return '/test-execution';
  }
  if (lower.includes('project') || lower.includes('member') || lower.includes('role')) {
    return '/admin/users';
  }
  return '/bugs';
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [companyName, setCompanyName] = useState<string>('Dailoqa Technologies Inc.');
  const popoverRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    const list = await api.getNotifications(user?.id);
    setNotifications(list);
  };

  const loadCompanyProfile = async () => {
    try {
      const profile = await api.getCompanyProfile();
      if (profile?.company_name) {
        setCompanyName(profile.company_name);
      }
    } catch {
      // Keep existing default
    }
  };

  useEffect(() => {
    loadNotifications();
    loadCompanyProfile();
    const unsub = api.subscribe(() => {
      loadNotifications();
      loadCompanyProfile();
    });
    return () => unsub();
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await api.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.is_read) {
      await api.markNotificationRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
    }
    setShowNotifications(false);
    const targetRoute = getNotificationRoute(notif.message);
    navigate(targetRoute);
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
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-primary-light text-primary border border-primary/20 tracking-wide shrink-0 max-w-[280px] truncate"
            title={`Company Legal Name: ${companyName}`}
          >
            {companyName}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Global Search with Centered Icon and Scoped Project Results */}
        <div className="hidden sm:block">
          <GlobalSearch />
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative text-secondary hover:text-navy-900 p-2 rounded-lg hover:bg-soft transition-colors"
            title="Notifications"
            aria-expanded={showNotifications}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-surface animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface rounded-xl border border-border shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-navy-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-medium text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
                  >
                    <CheckCheck size={13} />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-border">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-secondary">
                    No notifications for your account.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3 text-xs flex items-start justify-between gap-3 hover:bg-soft cursor-pointer transition-colors ${
                        !notif.is_read ? 'bg-primary-light/25 font-medium' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-navy-900 leading-snug break-words">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted">
                            {formatRelativeTime(notif.created_at)}
                          </span>
                          {!notif.is_read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
                          )}
                        </div>
                      </div>

                      {!notif.is_read && (
                        <button
                          onClick={(e) => handleMarkAsRead(e, notif.id)}
                          className="text-secondary hover:text-primary p-1 rounded-md hover:bg-surface border border-transparent hover:border-border transition-colors shrink-0"
                          title="Mark as read"
                        >
                          <Check size={13} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="pl-2 border-l border-border">
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
};
