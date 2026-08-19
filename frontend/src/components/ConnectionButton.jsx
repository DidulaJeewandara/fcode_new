import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';

const baseBtn = 'rounded-full px-4 py-1.5 text-sm font-semibold disabled:opacity-60';

const ConnectionButton = ({ userId, onStatusChange }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await api.get(`/users/${userId}/connection-status`);
      setStatus(data);
      onStatusChange?.(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load connection status');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const runAction = async (action) => {
    setError('');
    setBusy(true);
    try {
      await action();
      await fetchStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading || !status || status.status === 'SELF') return null;

  if (status.status === 'NOT_CONNECTED') {
    return (
      <div>
        <button
          disabled={busy}
          onClick={() => runAction(() => api.post(`/connections/${userId}`))}
          className={`${baseBtn} bg-linkedin text-white hover:bg-linkedin-dark`}
        >
          Connect
        </button>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  if (status.status === 'PENDING' && status.direction === 'OUTGOING') {
    return (
      <button disabled className={`${baseBtn} border border-gray-300 text-gray-500`}>
        Pending
      </button>
    );
  }

  if (status.status === 'PENDING' && status.direction === 'INCOMING') {
    return (
      <div className="flex gap-2">
        <button
          disabled={busy}
          onClick={() => runAction(() => api.patch(`/connections/${status.requestId}/accept`))}
          className={`${baseBtn} bg-linkedin text-white hover:bg-linkedin-dark`}
        >
          Accept
        </button>
        <button
          disabled={busy}
          onClick={() => runAction(() => api.patch(`/connections/${status.requestId}/reject`))}
          className={`${baseBtn} border border-gray-300 text-gray-600 hover:bg-gray-50`}
        >
          Reject
        </button>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  if (status.status === 'CONNECTED') {
    return (
      <button
        disabled={busy}
        onClick={() => runAction(() => api.delete(`/connections/${userId}`))}
        className={`${baseBtn} border border-green-600 text-green-700 hover:bg-red-50 hover:border-red-400 hover:text-red-600`}
        title="Click to remove connection"
      >
        Connected
      </button>
    );
  }

  return null;
};

export default ConnectionButton;
