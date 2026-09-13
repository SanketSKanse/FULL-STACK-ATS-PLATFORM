import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Bell,
  Check,
  Clock,
  Briefcase,
  Calendar,
  UserPlus,
  TrendingUp,
  X,
  Sparkles,
  ChevronRight
} from 'lucide-react';

/**
 * Formats relative timestamp
 */
function formatTimeAgo(dateString) {
  if (!dateString) return 'Recent';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 172800) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function NotificationDropdown({ onNotificationClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const dropdownRef = useRef(null);

  const token = localStorage.getItem('token');
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5001/api/notifications', authHeaders);
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000); // refresh periodically
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await axios.patch(`http://localhost:5001/api/notifications/${id}/read`, {}, authHeaders);
      setNotifications((prev) =>
        prev.map((item) => (item._id === id ? { ...item, read: true } : item))
      );
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.patch('http://localhost:5001/api/notifications/read-all', {}, authHeaders);
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  const handleClickItem = async (notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }
    setIsOpen(false);
    if (typeof onNotificationClick === 'function') {
      onNotificationClick(notification);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications = notifications.filter((n) =>
    filter === 'unread' ? !n.read : true
  );

  const getIcon = (type) => {
    switch (type) {
      case 'NEW_APPLICATION':
        return <UserPlus size={15} className="text-indigo-600 dark:text-indigo-400" />;
      case 'INTERVIEW_SCHEDULED':
        return <Calendar size={15} className="text-amber-600 dark:text-amber-400" />;
      case 'APPLICATION_PROGRESS':
        return <TrendingUp size={15} className="text-emerald-600 dark:text-emerald-400" />;
      case 'NEW_JOB':
        return <Briefcase size={15} className="text-indigo-600 dark:text-indigo-400" />;
      default:
        return <Bell size={15} className="text-indigo-600 dark:text-indigo-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        aria-label="View notifications"
        className="btn-notification-trigger relative flex h-10 w-10 items-center justify-center rounded-xl border shadow-md backdrop-blur-md transition active:scale-95"
      >
        <Bell size={16} className="shrink-0" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-[#07152d] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="glass-box notif-popover absolute right-0 top-12 z-50 w-[320px] sm:w-[380px] rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="notif-popover-header mb-3 flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <h3 className="notif-title text-sm font-bold">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-indigo-500/20 border border-indigo-400/40 px-2 py-0.5 text-[10px] font-bold text-indigo-400 dark:text-indigo-200">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="notif-mark-read text-[11px] font-semibold transition hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="notif-filter-track mb-3 flex gap-1 rounded-xl p-1 border">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`notif-filter-btn flex-1 rounded-lg py-1 text-center text-xs font-semibold transition ${
                filter === 'all'
                  ? 'notif-filter-btn-active shadow-xs'
                  : 'notif-filter-btn-inactive'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`notif-filter-btn flex-1 rounded-lg py-1 text-center text-xs font-semibold transition ${
                filter === 'unread'
                  ? 'notif-filter-btn-active shadow-xs'
                  : 'notif-filter-btn-inactive'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[340px] space-y-2 overflow-y-auto pr-0.5 custom-scrollbar">
            {filteredNotifications.length === 0 ? (
              <div className="py-8 text-center">
                <div className="notif-empty-icon mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full">
                  <Bell size={18} />
                </div>
                <p className="notif-title text-xs font-medium">No notifications here</p>
                <p className="notif-subtitle mt-0.5 text-[11px]">You're all caught up!</p>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleClickItem(item)}
                  className={`notif-item group relative flex cursor-pointer gap-3 rounded-xl p-2.5 transition border ${
                    !item.read ? 'notif-item-unread' : 'notif-item-read'
                  }`}
                >
                  <div className="notif-icon-wrapper mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border">
                    {getIcon(item.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <div className="notif-item-title text-xs font-semibold leading-tight">
                        {item.title}
                      </div>
                      <span className="notif-item-time shrink-0 text-[10px]">
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>
                    <p className="notif-item-message mt-1 line-clamp-2 text-[11px] leading-snug">
                      {item.message}
                    </p>
                  </div>
                  {!item.read && (
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500 shadow-xs" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
