import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ConnectionButton from '../components/ConnectionButton';
import FollowButton from '../components/FollowButton';
import api, { getAssetUrl } from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [people, setPeople] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPeople = async () => {
      try {
        const { data } = await api.get('/users');
        setPeople(data.users);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load people');
      }
    };
    loadPeople();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="mx-auto mt-6 max-w-2xl px-4">
        <Link to={`/profile/${user?.id}`} className="block rounded-lg bg-white p-6 shadow-sm hover:shadow-md">
          <h1 className="text-xl font-bold text-gray-800">Welcome, {user?.name}</h1>
          <p className="mt-2 text-gray-600">{user?.headline || 'Add a headline to your profile.'}</p>
          <p className="mt-4 text-sm font-semibold text-linkedin">View your profile &rarr;</p>
        </Link>

        <div className="mt-4 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">People you may know</h2>

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

          {people.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No other members yet.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {people.map((person) => (
                <li key={person.id} className="flex items-center justify-between rounded p-2 hover:bg-gray-50">
                  <Link to={`/profile/${person.id}`} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-semibold text-linkedin">
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
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    <ConnectionButton userId={person.id} />
                    <FollowButton userId={person.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
