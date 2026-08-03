import React, { useState, useEffect, useRef, useCallback } from 'react';
import { formatDateTime } from '../utils/helpers';
import { getUserNotifications, markAsRead, markAllAsRead } from '../services/notificationService';

/**
 * NotificationBell renders a bell icon with an unread-count badge.
 * Clicking opens a dropdown list of notifications.
 * Clicking a notification marks it as read.
 */
const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.isRead && !n.read).length;

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUserNotifications();
      setNotifications(Array.isArray(data) ? data : data.notifications || []);
    } catch {
      setError('Could not load notifications.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount and poll every 60 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) fetchNotifications();
  };

  const handleMarkAsRead = async (notification) => {
    if (notification.isRead || notification.read) return;
    try {
      await markAsRead(notification._id || notification.id);
      setNotifications((prev) =>
        prev.map((n) =>
          (n._id || n.id) === (notification._id || notification.id)
            ? { ...n, isRead: true, read: true }
            : n
        )
      );
    } catch {
      // Silently fail; the badge will resync on next poll
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, read: true }))
      );
    } catch {
      // Silently fail
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-full text-gray-300 hover:text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-red-500">{error}</p>
                <button
                  onClick={fetchNotifications}
                  className="mt-2 text-xs text-blue-600 hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <svg
                  className="mx-auto w-10 h-10 text-gray-300 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const isRead = notification.isRead || notification.read;
                return (
                  <button
                    key={notification._id || notification.id}
                    onClick={() => handleMarkAsRead(notification)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                      !isRead ? 'bg-blue-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${
                          !isRead ? 'bg-blue-500' : 'bg-transparent'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm leading-snug ${
                            !isRead
                              ? 'font-semibold text-gray-900'
                              : 'font-normal text-gray-600'
                          }`}
                        >
                          {notification.title || notification.message || 'Notification'}
                        </p>
                        {notification.body && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                            {notification.body}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDateTime(
                            notification.createdAt || notification.created_at
                          )}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
