import { useState } from 'react';
import api from '../api/axios';

const emptyForm = { title: '', company: '', description: '', startDate: '', endDate: '' };

const formatDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
};

const ExperienceSection = ({ experience, isOwnProfile, onChange }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.company.trim()) return;
    setError('');
    setSubmitting(true);
    try {
      await api.post('/users/me/experience', form);
      setForm(emptyForm);
      setShowForm(false);
      onChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add experience');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (experienceId) => {
    try {
      await api.delete(`/users/me/experience/${experienceId}`);
      onChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete experience');
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Experience</h2>
        {isOwnProfile && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="text-sm font-semibold text-linkedin hover:underline"
          >
            {showForm ? 'Cancel' : '+ Add'}
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {experience.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">No experience added yet.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-4">
          {experience.map((exp) => (
            <li key={exp.id} className="flex items-start justify-between border-b border-gray-100 pb-3 last:border-0">
              <div>
                <p className="font-medium text-gray-800">{exp.title}</p>
                <p className="text-sm text-gray-600">{exp.company}</p>
                {(exp.startDate || exp.endDate) && (
                  <p className="text-xs text-gray-400">
                    {formatDate(exp.startDate)} - {formatDate(exp.endDate) || 'Present'}
                  </p>
                )}
                {exp.description && <p className="mt-1 text-sm text-gray-600">{exp.description}</p>}
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => handleDelete(exp.id)}
                  className="text-sm text-gray-400 hover:text-red-500"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {isOwnProfile && showForm && (
        <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-2">
          <input
            type="text"
            placeholder="Title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-linkedin focus:outline-none"
          />
          <input
            type="text"
            placeholder="Company *"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            required
            className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-linkedin focus:outline-none"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-linkedin focus:outline-none"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-linkedin focus:outline-none"
            />
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-linkedin focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-1 self-start rounded-full bg-linkedin px-4 py-1.5 text-sm font-semibold text-white hover:bg-linkedin-dark disabled:opacity-60"
          >
            Save
          </button>
        </form>
      )}
    </div>
  );
};

export default ExperienceSection;
