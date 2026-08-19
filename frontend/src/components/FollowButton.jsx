import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const FollowButton = ({ userId }) => {
  const { user: currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const fetchFollowing = useCallback(async () => {
    if (!currentUser) return;
    try {
      const { data } = await api.get(`/users/${currentUser.id}/following`);
      setIsFollowing(data.following.some((u) => String(u.id) === String(userId)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load follow status');
    } finally {
      setLoading(false);
    }
  }, [userId, currentUser]);

  useEffect(() => {
    fetchFollowing();
  }, [fetchFollowing]);

  if (!currentUser || String(currentUser.id) === String(userId) || loading) return null;

  const toggleFollow = async () => {
    setError('');
    setBusy(true);
    try {
      if (isFollowing) {
        await api.delete(`/users/${userId}/follow`);
      } else {
        await api.post(`/users/${userId}/follow`);
      }
      await fetchFollowing();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        disabled={busy}
        onClick={toggleFollow}
        className={`rounded-full px-4 py-1.5 text-sm font-semibold disabled:opacity-60 ${
          isFollowing
            ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            : 'border border-linkedin text-linkedin hover:bg-blue-50'
        }`}
      >
        {isFollowing ? 'Unfollow' : 'Follow'}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default FollowButton;
