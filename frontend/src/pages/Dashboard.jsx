import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ConnectionButton from '../components/ConnectionButton';
import CreatePostBox from '../components/CreatePostBox';
import PostCard from '../components/PostCard';
import api, { getAssetUrl } from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [people, setPeople] = useState([]);
  const [peopleError, setPeopleError] = useState('');

  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [feedError, setFeedError] = useState('');
  const [loadingFeed, setLoadingFeed] = useState(true);

  const fetchFeed = useCallback(async (page = 1) => {
    setFeedError('');
    setLoadingFeed(true);
    try {
      const { data } = await api.get('/posts', { params: { page, limit: 10 } });
      setPosts(data.posts);
      setMeta({ page: data.page, totalPages: data.totalPages });
    } catch (err) {
      setFeedError(err.response?.data?.message || 'Failed to load feed');
    } finally {
      setLoadingFeed(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(1);

    const loadPeople = async () => {
      try {
        const { data } = await api.get('/users');
        setPeople(data.users.slice(0, 5));
      } catch (err) {
        setPeopleError(err.response?.data?.message || 'Failed to load people');
      }
    };
    loadPeople();
  }, [fetchFeed]);

  const handlePostCreated = (post) => {
    setPosts((prev) => [post, ...prev]);
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <Navbar />
      <div className="mx-auto mt-6 grid max-w-5xl grid-cols-1 gap-4 px-4 md:grid-cols-3">
        <div className="flex flex-col gap-4 md:col-span-2">
          <CreatePostBox onPostCreated={handlePostCreated} />

          {feedError && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 shadow-sm">{feedError}</div>
          )}

          {loadingFeed ? (
            <div className="rounded-lg bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
              Loading feed...
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-lg bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
              No posts yet. Be the first to share an update!
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} onUpdated={handlePostUpdated} onDeleted={handlePostDeleted} />
            ))
          )}

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pb-4">
              <button
                onClick={() => fetchFeed(meta.page - 1)}
                disabled={meta.page <= 1}
                className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {meta.page} of {meta.totalPages}
              </span>
              <button
                onClick={() => fetchFeed(meta.page + 1)}
                disabled={meta.page >= meta.totalPages}
                className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Link to={`/profile/${user?.id}`} className="block rounded-lg bg-white p-6 shadow-sm hover:shadow-md">
            <h1 className="text-base font-bold text-gray-800">{user?.name}</h1>
            <p className="mt-1 text-sm text-gray-600">{user?.headline || 'Add a headline to your profile.'}</p>
            <p className="mt-3 text-sm font-semibold text-linkedin">View your profile &rarr;</p>
          </Link>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-800">People you may know</h2>

            {peopleError && <p className="mt-2 text-xs text-red-600">{peopleError}</p>}

            {people.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">No other members yet.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {people.map((person) => (
                  <li key={person.id} className="flex items-center justify-between gap-2">
                    <Link to={`/profile/${person.id}`} className="flex min-w-0 items-center gap-2">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xs font-semibold text-linkedin">
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
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800">{person.name}</p>
                        {person.headline && <p className="truncate text-xs text-gray-500">{person.headline}</p>}
                      </div>
                    </Link>
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <ConnectionButton userId={person.id} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
