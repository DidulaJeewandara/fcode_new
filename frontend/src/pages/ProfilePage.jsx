import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SkillsSection from '../components/SkillsSection';
import EducationSection from '../components/EducationSection';
import ExperienceSection from '../components/ExperienceSection';
import ConnectionButton from '../components/ConnectionButton';
import FollowButton from '../components/FollowButton';
import api, { getAssetUrl } from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const isOwnProfile = currentUser && String(currentUser.id) === String(id);

  const fetchProfile = useCallback(async () => {
    setError('');
    try {
      const { data } = await api.get(`/users/${id}`);
      setProfile(data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <p className="mt-10 text-center text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <p className="mt-10 text-center text-red-600">{error || 'Profile not found'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <Navbar />
      <div className="mx-auto mt-6 flex max-w-2xl flex-col gap-4 px-4">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-2xl font-semibold text-linkedin">
                {profile.profilePicture ? (
                  <img
                    src={getAssetUrl(profile.profilePicture)}
                    alt={profile.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  profile.name?.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{profile.name}</h1>
                {profile.headline && <p className="text-gray-600">{profile.headline}</p>}
                {profile.location && <p className="text-sm text-gray-400">{profile.location}</p>}
              </div>
            </div>
            {isOwnProfile ? (
              <Link
                to="/profile/edit"
                className="rounded-full border border-linkedin px-4 py-1.5 text-sm font-semibold text-linkedin hover:bg-blue-50"
              >
                Edit profile
              </Link>
            ) : (
              <div className="flex items-start gap-2">
                <ConnectionButton userId={id} />
                <FollowButton userId={id} />
                <Link
                  to={`/messages?to=${id}`}
                  className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Message
                </Link>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-6 border-t border-gray-100 pt-4 text-sm text-gray-600">
            <span>
              <strong className="text-gray-800">{profile.connectionCount}</strong> connections
            </span>
            <span>
              <strong className="text-gray-800">{profile.postCount}</strong> posts
            </span>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">About</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-gray-600">
            {profile.bio || 'No bio added yet.'}
          </p>
        </div>

        <ExperienceSection
          experience={profile.experience}
          isOwnProfile={isOwnProfile}
          onChange={fetchProfile}
        />

        <EducationSection
          education={profile.education}
          isOwnProfile={isOwnProfile}
          onChange={fetchProfile}
        />

        <SkillsSection skills={profile.skills} isOwnProfile={isOwnProfile} onChange={fetchProfile} />
      </div>
    </div>
  );
};

export default ProfilePage;
