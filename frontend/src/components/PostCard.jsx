import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getAssetUrl } from '../api/axios';
import { useAuth } from '../context/AuthContext';

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

const PostCard = ({ post, onUpdated, onDeleted }) => {
  const { user: currentUser } = useAuth();
  const isOwnPost = currentUser && currentUser.id === post.author.id;

  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [shareCount, setShareCount] = useState(post.shareCount);
  const [likeBusy, setLikeBusy] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [commentBusy, setCommentBusy] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [saving, setSaving] = useState(false);

  const [shareCopied, setShareCopied] = useState(false);
  const [error, setError] = useState('');

  const toggleLike = async () => {
    setLikeBusy(true);
    setError('');
    try {
      if (isLiked) {
        await api.delete(`/posts/${post.id}/like`);
        setIsLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      } else {
        await api.post(`/posts/${post.id}/like`);
        setIsLiked(true);
        setLikeCount((c) => c + 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setLikeBusy(false);
    }
  };

  const loadComments = async () => {
    setShowComments((v) => !v);
    if (commentsLoaded) return;
    try {
      const { data } = await api.get(`/posts/${post.id}/comments`, { params: { limit: 20 } });
      setComments(data.comments);
      setCommentsLoaded(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load comments');
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentDraft.trim()) return;
    setCommentBusy(true);
    setError('');
    try {
      const { data } = await api.post(`/posts/${post.id}/comments`, { content: commentDraft.trim() });
      setComments((prev) => [...prev, data.comment]);
      setCommentCount((c) => c + 1);
      setCommentDraft('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setCommentBusy(false);
    }
  };

  const handleShare = async () => {
    try {
      const { data } = await api.post(`/posts/${post.id}/share`);
      setShareCount(data.shareCount);
      await navigator.clipboard?.writeText(`${window.location.origin}/feed?post=${post.id}`);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to share post');
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await api.put(`/posts/${post.id}`, { content: editContent.trim() });
      onUpdated?.(data.post);
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update post');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setError('');
    try {
      await api.delete(`/posts/${post.id}`);
      onDeleted?.(post.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete post');
    }
  };

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <Link to={`/profile/${post.author.id}`} className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-semibold text-linkedin">
            {post.author.profilePicture ? (
              <img
                src={getAssetUrl(post.author.profilePicture)}
                alt={post.author.name}
                className="h-full w-full object-cover"
              />
            ) : (
              post.author.name?.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{post.author.name}</p>
            {post.author.headline && <p className="text-xs text-gray-500">{post.author.headline}</p>}
            <p className="text-xs text-gray-400">{timeAgo(post.createdAt)}</p>
          </div>
        </Link>

        {isOwnPost && !isEditing && (
          <div className="flex gap-2 text-xs">
            <button onClick={() => setIsEditing(true)} className="font-semibold text-gray-500 hover:text-linkedin">
              Edit
            </button>
            <button onClick={handleDelete} className="font-semibold text-gray-500 hover:text-red-600">
              Delete
            </button>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {isEditing ? (
        <div className="mt-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            maxLength={3000}
            className="w-full resize-none rounded border border-gray-300 px-3 py-2 text-sm focus:border-linkedin focus:outline-none"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={saving || !editContent.trim()}
              className="rounded-full bg-linkedin px-4 py-1 text-xs font-semibold text-white hover:bg-linkedin-dark disabled:opacity-60"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(post.content);
              }}
              className="rounded-full border border-gray-300 px-4 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        post.content && <p className="mt-3 whitespace-pre-line text-sm text-gray-800">{post.content}</p>
      )}

      {post.imageUrl && !isEditing && (
        <img src={getAssetUrl(post.imageUrl)} alt="Post attachment" className="mt-3 max-h-96 w-full rounded object-cover" />
      )}

      <div className="mt-3 flex items-center gap-4 border-t border-gray-100 pt-2 text-xs text-gray-500">
        <span>
          {likeCount} like{likeCount !== 1 ? 's' : ''}
        </span>
        <span>
          {commentCount} comment{commentCount !== 1 ? 's' : ''}
        </span>
        <span>
          {shareCount} share{shareCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="mt-1 flex border-t border-gray-100 pt-1 text-sm">
        <button
          onClick={toggleLike}
          disabled={likeBusy}
          className={`flex-1 rounded py-1.5 text-center font-semibold hover:bg-gray-50 disabled:opacity-60 ${
            isLiked ? 'text-linkedin' : 'text-gray-600'
          }`}
        >
          {isLiked ? 'Liked' : 'Like'}
        </button>
        <button onClick={loadComments} className="flex-1 rounded py-1.5 text-center font-semibold text-gray-600 hover:bg-gray-50">
          Comment
        </button>
        <button onClick={handleShare} className="flex-1 rounded py-1.5 text-center font-semibold text-gray-600 hover:bg-gray-50">
          {shareCopied ? 'Link copied!' : 'Share'}
        </button>
      </div>

      {showComments && (
        <div className="mt-2 border-t border-gray-100 pt-2">
          {comments.length === 0 ? (
            <p className="py-2 text-xs text-gray-500">No comments yet. Be the first to comment.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xs font-semibold text-linkedin">
                    {c.user?.profilePicture ? (
                      <img src={getAssetUrl(c.user.profilePicture)} alt={c.user.name} className="h-full w-full object-cover" />
                    ) : (
                      c.user?.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="rounded-lg bg-gray-100 px-3 py-1.5">
                    <p className="text-xs font-semibold text-gray-800">{c.user?.name}</p>
                    <p className="text-sm text-gray-700">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={submitComment} className="mt-2 flex gap-2">
            <input
              type="text"
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              placeholder="Write a comment..."
              maxLength={3000}
              className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-linkedin focus:outline-none"
            />
            <button
              type="submit"
              disabled={commentBusy || !commentDraft.trim()}
              className="rounded-full bg-linkedin px-4 py-1.5 text-xs font-semibold text-white hover:bg-linkedin-dark disabled:opacity-60"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PostCard;
