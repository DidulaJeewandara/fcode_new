import { useRef, useState } from 'react';
import api, { getAssetUrl } from '../api/axios';
import { useAuth } from '../context/AuthContext';

const CreatePostBox = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setError('');
    setPosting(true);
    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      if (imageFile) formData.append('image', imageFile);

      const { data } = await api.post('/posts', formData);
      setContent('');
      clearImage();
      onPostCreated?.(data.post);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-semibold text-linkedin">
          {user?.profilePicture ? (
            <img src={getAssetUrl(user.profilePicture)} alt={user.name} className="h-full w-full object-cover" />
          ) : (
            user?.name?.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share an update..."
            rows={2}
            maxLength={3000}
            className="w-full resize-none rounded border border-gray-300 px-3 py-2 text-sm focus:border-linkedin focus:outline-none"
          />

          {imagePreview && (
            <div className="relative mt-2 inline-block">
              <img src={imagePreview} alt="Preview" className="max-h-40 rounded border border-gray-200" />
              <button
                type="button"
                onClick={clearImage}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-xs text-white hover:bg-gray-900"
                aria-label="Remove image"
              >
                &times;
              </button>
            </div>
          )}

          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

          <div className="mt-2 flex items-center justify-between">
            <label className="cursor-pointer text-sm font-medium text-gray-500 hover:text-linkedin">
              Add photo
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
            <button
              type="submit"
              disabled={posting || !content.trim()}
              className="rounded-full bg-linkedin px-5 py-1.5 text-sm font-semibold text-white hover:bg-linkedin-dark disabled:opacity-60"
            >
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreatePostBox;
