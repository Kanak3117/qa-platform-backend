import React, { useState, useEffect } from 'react';
import { Search, Bell, Menu, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Notification } from '../../types';

interface TopBarProps {
  onToggleSidebar?: () => void;
  onSearch?: (query: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar, onSearch }) => {
  const { currentProject, user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  useEffect(() => {
    api.getNotifications().then(setNotifications);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchVal(val);
    if (onSearch) onSearch(val);
  };

  return (
    <header className="h-14 bg-surface border-b border-border px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden text-secondary hover:text-navy-900 p-1 rounded-md hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-secondary border border-gray-200">
            QA PLATFORM
          </span>
          <span className="text-sm font-semibold text-navy-900 truncate max-w-[280px]">
            {currentProject?.name || 'Dailoqa Core Platform'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Field */}
        <div className="relative hidden sm:block w-64 md:w-80">
          <Search size={15} className="absolute left-3 top-2.5 text-muted pointer-events-none" />
          <input
            type="text"
            value={searchVal}
            onChange={handleSearchChange}
            placeholder="Search test cases, bugs (e.g. BUG-00421)..."
            className="w-full text-xs bg-soft border border-border rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white text-navy-900 transition-colors"
          />
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative text-secondary hover:text-navy-900 p-2 rounded-lg hover:bg-soft transition-colors"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-surface rounded-card border border-border shadow-lg py-2 z-50">
              <div className="px-4 py-2 border-b border-border flex items-center justify-between">
                <span className="text-xs font-semibold text-navy-900">Notifications</span>
                <span className="text-[11px] text-muted">{unreadCount} unread</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-secondary">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 text-xs flex items-start justify-between gap-2 hover:bg-soft transition-colors ${
                        !notif.is_read ? 'bg-primary-light/30' : ''
                      }`}
                    >
                      <div>
                        <p className="text-navy-900 font-medium leading-relaxed">{notif.message}</p>
                        <span className="text-[10px] text-muted">
                          {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {!notif.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="text-primary hover:text-primary-hover p-1 rounded"
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User indicator */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-primary text-white font-semibold flex items-center justify-center text-xs shadow-xs">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'QA'}
          </div>
        </div>
      </div>
    </header>
  );
};
