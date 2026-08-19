import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api, { getAssetUrl } from '../api/axios';
import { useAuth } from '../context/AuthContext';

const EditProfile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', headline: '', bio: '', location: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        headline: user.headline || '',
        bio: user.bio || '',
        location: user.location || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const { data } = await api.put('/users/me', form);
      updateUser(data.user);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setSuccess('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      const { data } = await api.post('/users/me/profile-picture', formData);
      updateUser(data.user);
      setSuccess('Profile picture updated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <Navbar />
      <div className="mx-auto mt-6 max-w-xl px-4">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-gray-800">Edit profile</h1>

          {error && (
            <div className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
          )}
          {success && (
            <div className="mt-4 rounded bg-green-50 px-3 py-2 text-sm text-green-600">{success}</div>
          )}

          <div className="mt-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xl font-semibold text-linkedin">
              {user.profilePicture ? (
                <img
                  src={getAssetUrl(user.profilePicture)}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                user.name?.charAt(0).toUpperCase()
              )}
            </div>
            <label className="cursor-pointer rounded-full border border-linkedin px-4 py-1.5 text-sm font-semibold text-linkedin hover:bg-blue-50">
              {uploading ? 'Uploading...' : 'Change photo'}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full rounded border border-gray-300 px-3 py-2 focus:border-linkedin focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Headline</label>
              <input
                type="text"
                value={form.headline}
                onChange={(e) => setForm({ ...form, headline: e.target.value })}
                placeholder="e.g. Software Engineer at Acme"
                className="w-full rounded border border-gray-300 px-3 py-2 focus:border-linkedin focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">About</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={4}
                className="w-full rounded border border-gray-300 px-3 py-2 focus:border-linkedin focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. San Francisco, CA"
                className="w-full rounded border border-gray-300 px-3 py-2 focus:border-linkedin focus:outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-linkedin px-5 py-2 text-sm font-semibold text-white hover:bg-linkedin-dark disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/profile/${user.id}`)}
                className="rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Back to profile
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
