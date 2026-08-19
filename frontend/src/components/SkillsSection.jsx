import { useState } from 'react';
import api from '../api/axios';

const SkillsSection = ({ skills, isOwnProfile, onChange }) => {
  const [newSkill, setNewSkill] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    setError('');
    setSubmitting(true);
    try {
      await api.post('/users/me/skills', { name: newSkill.trim() });
      setNewSkill('');
      onChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add skill');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (skillId) => {
    try {
      await api.delete(`/users/me/skills/${skillId}`);
      onChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete skill');
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800">Skills</h2>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {skills.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">No skills added yet.</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill.id}
              className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm text-linkedin"
            >
              {skill.name}
              {isOwnProfile && (
                <button
                  onClick={() => handleDelete(skill.id)}
                  aria-label={`Remove ${skill.name}`}
                  className="text-blue-400 hover:text-red-500"
                >
                  &times;
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {isOwnProfile && (
        <form onSubmit={handleAdd} className="mt-4 flex gap-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Add a skill"
            className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-linkedin focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full border border-linkedin px-4 py-1.5 text-sm font-semibold text-linkedin hover:bg-blue-50 disabled:opacity-60"
          >
            Add
          </button>
        </form>
      )}
    </div>
  );
};

export default SkillsSection;
