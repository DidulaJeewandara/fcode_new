import { useState } from 'react';
import api from '../api/axios';

const emptyForm = { school: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '' };

const formatDate = (value) => {
  if (!value) return '';
  return new Date(value).getFullYear();
};

const EducationSection = ({ education, isOwnProfile, onChange }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.school.trim()) return;
    setError('');
    setSubmitting(true);
    try {
      await api.post('/users/me/education', form);
      setForm(emptyForm);
      setShowForm(false);
      onChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add education');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (educationId) => {
    try {
      await api.delete(`/users/me/education/${educationId}`);
      onChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete education');
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Education</h2>
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

      {education.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">No education added yet.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-4">
          {education.map((edu) => (
            <li key={edu.id} className="flex items-start justify-between border-b border-gray-100 pb-3 last:border-0">
              <div>
                <p className="font-medium text-gray-800">{edu.school}</p>
                <p className="text-sm text-gray-600">
                  {[edu.degree, edu.fieldOfStudy].filter(Boolean).join(', ')}
                </p>
                {(edu.startDate || edu.endDate) && (
                  <p className="text-xs text-gray-400">
                    {formatDate(edu.startDate)} - {formatDate(edu.endDate) || 'Present'}
                  </p>
                )}
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => handleDelete(edu.id)}
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
            placeholder="School *"
            value={form.school}
            onChange={(e) => setForm({ ...form, school: e.target.value })}
            required
            className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-linkedin focus:outline-none"
          />
          <input
            type="text"
            placeholder="Degree"
            value={form.degree}
            onChange={(e) => setForm({ ...form, degree: e.target.value })}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-linkedin focus:outline-none"
          />
          <input
            type="text"
            placeholder="Field of study"
            value={form.fieldOfStudy}
            onChange={(e) => setForm({ ...form, fieldOfStudy: e.target.value })}
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

export default EducationSection;
