import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ConnectionButton from '../components/ConnectionButton';
import FollowButton from '../components/FollowButton';
import api, { getAssetUrl } from '../api/axios';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = async (q, page = 1) => {
    if (!q.trim()) return;
    setError('');
    setLoading(true);
    try {
      const { data } = await api.get('/users/search', { params: { q, page, limit: 10 } });
      setResults(data.users);
      setMeta({ page: data.page, limit: data.limit, total: data.total, totalPages: data.totalPages });
      setSearched(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      runSearch(initialQuery, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchParams(query ? { q: query } : {});
    runSearch(query, 1);
  };

  const goToPage = (page) => {
    if (page < 1 || page > meta.totalPages) return;
    runSearch(query, page);
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <Navbar />
      <div className="mx-auto mt-6 max-w-2xl px-4">
        <form onSubmit={handleSubmit} className="flex gap-2 rounded-lg bg-white p-4 shadow-sm">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, headline, or skill..."
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-linkedin focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-linkedin px-5 py-2 text-sm font-semibold text-white hover:bg-linkedin-dark disabled:opacity-60"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {searched && !loading && (
          <p className="mt-4 text-sm text-gray-500">
            {meta.total} result{meta.total !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
          </p>
        )}

        <div className="mt-2 flex flex-col gap-3">
          {results.map((person) => (
            <div key={person.id} className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
              <Link to={`/profile/${person.id}`} className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-base font-semibold text-linkedin">
                  {person.profilePicture ? (
                    <img
                      src={getAssetUrl(person.profilePicture)}
                      alt={person.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    person.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{person.name}</p>
                  {person.headline && <p className="text-xs text-gray-500">{person.headline}</p>}
                  {person.location && <p className="text-xs text-gray-400">{person.location}</p>}
                  {person.skills?.length > 0 && (
                    <p className="mt-1 text-xs text-gray-400">
                      Skills: {person.skills.map((s) => s.name).join(', ')}
                    </p>
                  )}
                </div>
              </Link>
              <div className="flex items-center gap-2">
                <ConnectionButton userId={person.id} />
                <FollowButton userId={person.id} />
              </div>
            </div>
          ))}
        </div>

        {meta.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => goToPage(meta.page - 1)}
              disabled={meta.page <= 1}
              className="rounded-full border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {meta.page} of {meta.totalPages}
            </span>
            <button
              onClick={() => goToPage(meta.page + 1)}
              disabled={meta.page >= meta.totalPages}
              className="rounded-full border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
