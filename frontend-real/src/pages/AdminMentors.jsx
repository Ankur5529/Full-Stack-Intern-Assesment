import { useState, useEffect, useCallback } from "react";
import * as adminApi from "../api/admin";

export default function AdminMentors() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const loadMentors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.listMentors();
      setMentors(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load mentors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMentors();
  }, [loadMentors]);

  const handleEditClick = (mentor) => {
    setEditingId(mentor.id);
    const p = mentor.mentorProfile || {};
    setEditForm({
      isTech: !!p.isTech,
      bigCompany: !!p.bigCompany,
      seniorDev: !!p.seniorDev,
      goodComm: !!p.goodComm,
      country: p.country || "",
      description: p.description || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async (mentorId) => {
    setSaving(true);
    try {
      await adminApi.updateMentorProfile(mentorId, editForm);
      await loadMentors();
      setEditingId(null);
    } catch (e) {
      setError(e.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Manage Mentors</h1>
        <p className="text-sm text-ink-400 mt-0.5">
          Update mentor metadata (tags and descriptions) used by the AI matching engine.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/60 border border-red-900/50 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      {loading ? (
        <div className="text-center py-12 text-ink-500 text-sm">Loading...</div>
      ) : mentors.length === 0 ? (
        <div className="mq-card p-12 text-center text-ink-400">No mentors found.</div>
      ) : (
        <div className="space-y-4">
          {mentors.map((mentor) => {
            const p = mentor.mentorProfile || {};
            const isEditing = editingId === mentor.id;

            return (
              <div key={mentor.id} className="mq-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-white">{mentor.name}</h2>
                    <p className="text-xs text-ink-500">{mentor.email}</p>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => handleEditClick(mentor)}
                      className="mq-btn-secondary h-8 px-3 text-xs"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-4 space-y-4 border-t border-white/[0.06] pt-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.isTech}
                          onChange={(e) => handleChange("isTech", e.target.checked)}
                          className="rounded bg-navy-800 border-white/20 text-primary-600 focus:ring-primary-500"
                        />
                        Tech Background
                      </label>
                      <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.bigCompany}
                          onChange={(e) => handleChange("bigCompany", e.target.checked)}
                          className="rounded bg-navy-800 border-white/20 text-primary-600 focus:ring-primary-500"
                        />
                        Big Company
                      </label>
                      <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.seniorDev}
                          onChange={(e) => handleChange("seniorDev", e.target.checked)}
                          className="rounded bg-navy-800 border-white/20 text-primary-600 focus:ring-primary-500"
                        />
                        Senior Dev
                      </label>
                      <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.goodComm}
                          onChange={(e) => handleChange("goodComm", e.target.checked)}
                          className="rounded bg-navy-800 border-white/20 text-primary-600 focus:ring-primary-500"
                        />
                        Good Comm.
                      </label>
                    </div>
                    <div>
                      <label className="mq-label">Country</label>
                      <input
                        type="text"
                        value={editForm.country}
                        onChange={(e) => handleChange("country", e.target.value)}
                        className="mq-input max-w-xs"
                        placeholder="e.g. Ireland, India, USA"
                      />
                    </div>
                    <div>
                      <label className="mq-label">Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => handleChange("description", e.target.value)}
                        className="mq-input h-24 py-2 resize-none"
                        placeholder="Mentor background and expertise..."
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={handleCancelEdit} className="mq-btn-secondary text-xs h-8">
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSave(mentor.id)}
                        disabled={saving}
                        className="mq-btn-primary text-xs h-8"
                      >
                        {saving ? "Saving..." : "Save Profile"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      {p.isTech && <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.08] text-ink-300">Tech</span>}
                      {p.bigCompany && <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.08] text-ink-300">Big Co</span>}
                      {p.seniorDev && <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.08] text-ink-300">Senior</span>}
                      {p.goodComm && <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.08] text-ink-300">Good Comm</span>}
                      {p.country && <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.08] text-ink-300">🌍 {p.country}</span>}
                    </div>
                    {p.description ? (
                      <p className="text-sm text-ink-400">{p.description}</p>
                    ) : (
                      <p className="text-sm text-ink-600 italic">No description provided.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
