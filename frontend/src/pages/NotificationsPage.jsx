import { useCallback, useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import api, { getAssetUrl } from '../api/axios';

const timeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async (page = 1) => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.get('/notifications', { params: { page, limit: 20 } });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setMeta({ page: data.page, totalPages: data.totalPages });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  const handleMarkRead = async (notification) => {
    if (notification.read) return;
    try {
      await api.patch(`/notifications/${notification.id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark all as read');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <Navbar />
      <div className="mx-auto mt-6 max-w-2xl px-4">
        <div className="rounded-lg bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h1 className="text-lg font-bold text-gray-800">
              Notifications {unreadCount > 0 && <span className="text-sm font-normal text-gray-500">({unreadCount} unread)</span>}
            </h1>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-sm font-semibold text-linkedin hover:underline">
                Mark all as read
              </button>
            )}
          </div>

          {error && <p className="px-6 py-3 text-sm text-red-600">{error}</p>}

          {loading ? (
            <p className="px-6 py-8 text-center text-sm text-gray-500">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-500">No notifications yet.</p>
          ) : (
            <div>
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleMarkRead(n)}
                  className={`flex w-full items-start gap-3 border-b border-gray-50 px-6 py-4 text-left last:border-0 hover:bg-gray-50 ${
                    n.read ? 'bg-white' : 'bg-blue-50'
                  }`}
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-semibold text-linkedin">
                    {n.sender?.profilePicture ? (
                      <img
                        src={getAssetUrl(n.sender.profilePicture)}
                        alt={n.sender.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      n.sender?.name?.charAt(0).toUpperCase() || '?'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${n.read ? 'text-gray-600' : 'font-medium text-gray-800'}`}>{n.message}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-linkedin" />}
                </button>
              ))}
            </div>
          )}

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 border-t border-gray-100 py-3">
              <button
                onClick={() => fetchNotifications(meta.page - 1)}
                disabled={meta.page <= 1}
                className="rounded-full border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {meta.page} of {meta.totalPages}
              </span>
              <button
                onClick={() => fetchNotifications(meta.page + 1)}
                disabled={meta.page >= meta.totalPages}
                className="rounded-full border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
