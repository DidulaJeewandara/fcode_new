import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api, { getAssetUrl } from '../api/axios';

const PersonRow = ({ person, right }) => (
  <div className="flex items-center justify-between rounded p-2 hover:bg-gray-50">
    <Link to={`/profile/${person.id}`} className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-base font-semibold text-linkedin">
        {person.profilePicture ? (
          <img src={getAssetUrl(person.profilePicture)} alt={person.name} className="h-full w-full object-cover" />
        ) : (
          person.name?.charAt(0).toUpperCase()
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-800">{person.name}</p>
        {person.headline && <p className="text-xs text-gray-500">{person.headline}</p>}
      </div>
    </Link>
    {right}
  </div>
);

const ConnectionsPage = () => {
  const [tab, setTab] = useState('connections');
  const [connections, setConnections] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const fetchData = useCallback(async () => {
    setError('');
    try {
      const [connRes, reqRes] = await Promise.all([api.get('/connections'), api.get('/connections/requests')]);
      setConnections(connRes.data.connections);
      setRequests(reqRes.data.requests);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load connections');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAccept = async (requestId) => {
    setBusyId(requestId);
    try {
      await api.patch(`/connections/${requestId}/accept`);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept request');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (requestId) => {
    setBusyId(requestId);
    try {
      await api.patch(`/connections/${requestId}/reject`);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (userId) => {
    setBusyId(userId);
    try {
      await api.delete(`/connections/${userId}`);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove connection');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <Navbar />
      <div className="mx-auto mt-6 max-w-2xl px-4">
        <div className="rounded-lg bg-white shadow-sm">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setTab('connections')}
              className={`flex-1 py-3 text-sm font-semibold ${
                tab === 'connections' ? 'border-b-2 border-linkedin text-linkedin' : 'text-gray-500'
              }`}
            >
              My Connections ({connections.length})
            </button>
            <button
              onClick={() => setTab('requests')}
              className={`flex-1 py-3 text-sm font-semibold ${
                tab === 'requests' ? 'border-b-2 border-linkedin text-linkedin' : 'text-gray-500'
              }`}
            >
              Requests ({requests.length})
            </button>
          </div>

          <div className="p-4">
            {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : tab === 'connections' ? (
              connections.length === 0 ? (
                <p className="text-sm text-gray-500">You have no connections yet.</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {connections.map((person) => (
                    <PersonRow
                      key={person.id}
                      person={person}
                      right={
                        <button
                          disabled={busyId === person.id}
                          onClick={() => handleRemove(person.id)}
                          className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600 hover:border-red-400 hover:text-red-600 disabled:opacity-60"
                        >
                          Remove
                        </button>
                      }
                    />
                  ))}
                </div>
              )
            ) : requests.length === 0 ? (
              <p className="text-sm text-gray-500">No pending requests.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {requests.map((request) => (
                  <PersonRow
                    key={request.id}
                    person={request.requester}
                    right={
                      <div className="flex gap-2">
                        <button
                          disabled={busyId === request.id}
                          onClick={() => handleAccept(request.id)}
                          className="rounded-full bg-linkedin px-3 py-1 text-xs font-semibold text-white hover:bg-linkedin-dark disabled:opacity-60"
                        >
                          Accept
                        </button>
                        <button
                          disabled={busyId === request.id}
                          onClick={() => handleReject(request.id)}
                          className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </div>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionsPage;
