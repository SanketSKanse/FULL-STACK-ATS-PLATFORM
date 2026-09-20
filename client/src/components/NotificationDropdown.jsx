import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
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

  // Helper to get locally saved read IDs
  const getLocallyReadIds = () => {
    try {
      return JSON.parse(localStorage.getItem('ats_read_notifications') || '[]');
    } catch {
      return [];
    }
  };

  const markIdsLocallyRead = (ids) => {
    try {
      const existing = getLocallyReadIds();
      const merged = Array.from(new Set([...existing, ...ids]));
      localStorage.setItem('ats_read_notifications', JSON.stringify(merged));
    } catch (e) {
      console.error('Error saving read notifications locally:', e);
    }
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await api.get('/api/notifications');
      const serverData = res.data || [];
      const localReadIds = new Set(getLocallyReadIds());

      // Merge server read status with any immediate client read cache
      const merged = serverData.map((item) => {
        if (item.read || localReadIds.has(String(item._id)) || (item.synthKey && localReadIds.has(item.synthKey))) {
          return { ...item, read: true };
        }
        return item;
      });

      // Defensive deduplication guarantee: ensures unique notifications on all dashboard pages
      const seen = new Set();
      const deduped = [];
      for (const item of merged) {
        const appId = item.metadata?.applicationId || (item.link && item.link.length === 24 ? item.link : '');
        const jobId = item.metadata?.jobId || '';
        const status = item.metadata?.status || '';
        const normMsg = (item.message || '').replace(/["'\\]/g, '').replace(/\s+/g, ' ').trim();

        let dedupeKey;
        if (item.synthKey) {
          dedupeKey = item.synthKey;
        } else if (item.type === 'NEW_APPLICATION' && appId) {
          dedupeKey = `synth-app-${appId}`;
        } else if (item.type === 'APPLICATION_PROGRESS' && appId) {
          dedupeKey = `synth-stat-${appId}-${status}`;
        } else if (item.type === 'NEW_JOB' && jobId) {
          dedupeKey = `synth-job-${jobId}`;
        } else {
          dedupeKey = `${item.type}_${item.title}_${normMsg}`;
        }

        if (!seen.has(dedupeKey)) {
          seen.add(dedupeKey);
          deduped.push(item);
        }
      }

      setNotifications(deduped);
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
      markIdsLocallyRead([String(id)]);
      setNotifications((prev) =>
        prev.map((item) => (item._id === id || item.synthKey === id ? { ...item, read: true } : item))
      );
      await api.patch(`/api/notifications/${id}/read`, {});
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const allIds = notifications.map((n) => String(n._id)).concat(
        notifications.filter((n) => n.synthKey).map((n) => n.synthKey)
      );
      markIdsLocallyRead(allIds);
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      await api.patch('/api/notifications/read-all', {});
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
        return <UserPlus size={15} className="text-[#2B2B2B]" />;
      case 'INTERVIEW_SCHEDULED':
        return <Calendar size={15} className="text-[#B45309]" />;
      case 'APPLICATION_PROGRESS':
        return <TrendingUp size={15} className="text-[#15803D]" />;
      case 'NEW_JOB':
        return <Briefcase size={15} className="text-[#2B2B2B]" />;
      default:
        return <Bell size={15} className="text-[#2B2B2B]" />;
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
        className="btn-notification-trigger relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#D8D1C7] bg-[#FAF7F2] text-[#2B2B2B] shadow-sm transition hover:bg-[#ECE4D6] active:scale-95"
      >
        <Bell size={16} className="shrink-0 text-[#2B2B2B]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2B2B2B] px-1 text-[10px] font-bold text-[#F3EDE2] shadow-sm ring-2 ring-[#F3EDE2] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="notif-popover absolute right-0 top-12 z-50 w-[320px] sm:w-[380px] rounded-2xl border border-[#D8D1C7] bg-[#FAF7F2] p-4 text-[#2B2B2B] shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between border-b border-[#D8D1C7] pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#2B2B2B]">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#2B2B2B] px-2 py-0.5 text-[10px] font-bold text-[#F3EDE2]">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-[#5E5953] transition hover:text-[#2B2B2B] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="mb-3 flex gap-1 rounded-xl border border-[#D8D1C7] bg-[#F3EDE2] p-1">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`flex-1 rounded-lg py-1 text-center text-xs font-semibold transition ${filter === 'all'
                  ? 'bg-[#2B2B2B] text-[#F3EDE2] shadow-xs'
                  : 'text-[#5E5953] hover:text-[#2B2B2B]'
                }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`flex-1 rounded-lg py-1 text-center text-xs font-semibold transition ${filter === 'unread'
                  ? 'bg-[#2B2B2B] text-[#F3EDE2] shadow-xs'
                  : 'text-[#5E5953] hover:text-[#2B2B2B]'
                }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[340px] space-y-2 overflow-y-auto pr-0.5 custom-scrollbar">
            {filteredNotifications.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#EAE3D5] text-[#2B2B2B]">
                  <Bell size={18} />
                </div>
                <p className="text-xs font-bold text-[#2B2B2B]">No notifications here</p>
                <p className="mt-0.5 text-[11px] text-[#5E5953]">You're all caught up!</p>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleClickItem(item)}
                  className={`group relative flex cursor-pointer gap-3 rounded-xl p-2.5 transition border ${!item.read
                      ? 'border-[#D8D1C7] bg-[#FFFFFF] shadow-xs'
                      : 'border-transparent bg-[#FAF7F2] hover:bg-[#F3EDE2]'
                    }`}
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#D8D1C7] bg-[#F3EDE2] text-[#2B2B2B]">
                    {getIcon(item.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <div className="text-xs font-bold leading-tight text-[#2B2B2B]">
                        {item.title}
                      </div>
                      <span className="shrink-0 text-[10px] text-[#7A746D]">
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-[#5E5953]">
                      {item.message}
                    </p>
                  </div>
                  {!item.read && (
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#2B2B2B] shadow-xs" />
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
