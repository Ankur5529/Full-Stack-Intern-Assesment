import { useState, useEffect, useCallback } from "react";
import * as crApi from "../api/callRequests";

const CALL_TYPES = [
  {
    value: "RESUME_REVAMP",
    label: "Resume Revamp",
    emoji: "📄",
    desc: "Get expert feedback on your resume for your target roles.",
  },
  {
    value: "JOB_MARKET_GUIDANCE",
    label: "Job Market Guidance",
    emoji: "🗺️",
    desc: "Navigate the current job market with an insider's perspective.",
  },
  {
    value: "MOCK_INTERVIEW",
    label: "Mock Interview",
    emoji: "🎤",
    desc: "Practice real interview scenarios with a domain-matched mentor.",
  },
];

const STATUS_STYLES = {
  PENDING: "bg-yellow-950/60 text-yellow-400 border border-yellow-900/50",
  MATCHED: "bg-blue-950/60 text-blue-400 border border-blue-900/50",
  BOOKED: "bg-green-950/60 text-green-400 border border-green-900/50",
  CANCELLED: "bg-white/[0.04] text-ink-500 border border-white/[0.08]",
};

export default function CallRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await crApi.listMyRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedType) { setError("Please choose a call type."); return; }
    setSubmitting(true);
    setError("");
    try {
      await crApi.createRequest({ callType: selectedType, description: description.trim() });
      setSuccess("Request submitted! An admin will match you with a mentor.");
      setShowForm(false);
      setSelectedType("");
      setDescription("");
      loadRequests();
    } catch (err) {
      setError(err?.data?.error || err?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await crApi.cancelRequest(id);
      loadRequests();
    } catch (err) {
      setError(err?.data?.error || "Failed to cancel");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Call Requests</h1>
          <p className="text-sm text-ink-400 mt-0.5">
            Request a session — an admin will match you with the best mentor.
          </p>
        </div>
        {!showForm && (
          <button
            id="new-request-btn"
            type="button"
            onClick={() => { setShowForm(true); setError(""); setSuccess(""); }}
            className="mq-btn-primary shrink-0"
          >
            + New Request
          </button>
        )}
      </div>

      {/* Success banner */}
      {success && (
        <div className="px-4 py-3 rounded-lg bg-green-950/60 text-green-400 border border-green-900/50 text-sm">
          ✓ {success}
        </div>
      )}

      {/* New request form */}
      {showForm && (
        <div className="mq-card p-6 space-y-5">
          <h2 className="text-base font-semibold text-white">New Call Request</h2>

          {/* Type selector */}
          <div>
            <span className="mq-label">Call type</span>
            <div className="grid grid-cols-1 gap-2 mt-1.5">
              {CALL_TYPES.map((ct) => (
                <button
                  key={ct.value}
                  type="button"
                  id={`type-${ct.value.toLowerCase()}`}
                  onClick={() => setSelectedType(ct.value)}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                    selectedType === ct.value
                      ? "border-white/30 bg-white/[0.08]"
                      : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]"
                  }`}
                >
                  <span className="text-2xl leading-none mt-0.5">{ct.emoji}</span>
                  <div>
                    <div className="text-sm font-medium text-white">{ct.label}</div>
                    <div className="text-xs text-ink-400 mt-0.5">{ct.desc}</div>
                  </div>
                  {selectedType === ct.value && (
                    <svg
                      className="ml-auto shrink-0 mt-0.5 h-4 w-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="request-description" className="mq-label">
              Background & goals{" "}
              <span className="text-ink-600 font-normal normal-case">optional</span>
            </label>
            <textarea
              id="request-description"
              className="mq-input h-28 py-2.5 resize-none"
              placeholder="Briefly describe your background, current situation, and what you hope to get from the session…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/60 border border-red-900/50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(""); }}
              className="mq-btn-secondary"
            >
              Cancel
            </button>
            <button
              id="submit-request-btn"
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !selectedType}
              className="mq-btn-primary"
            >
              {submitting ? "Submitting…" : "Submit Request"}
            </button>
          </div>
        </div>
      )}

      {/* Request list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-ink-500 text-sm">
          Loading…
        </div>
      ) : requests.length === 0 ? (
        <div className="mq-card p-12 text-center space-y-3">
          <div className="text-4xl opacity-40">📭</div>
          <p className="text-sm font-medium text-ink-400">No requests yet</p>
          <p className="text-xs text-ink-500">
            Submit your first call request to get matched with a mentor.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const ct = CALL_TYPES.find((t) => t.value === req.callType);
            return (
              <div key={req.id} className="mq-card p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl leading-none">{ct?.emoji}</span>
                    <div>
                      <div className="text-sm font-semibold text-white">{ct?.label}</div>
                      <div className="text-xs text-ink-500 mt-0.5">
                        {new Date(req.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                      STATUS_STYLES[req.status] || STATUS_STYLES.CANCELLED
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                {req.description && (
                  <p className="text-sm text-ink-400 leading-relaxed">{req.description}</p>
                )}

                {/* Booking info */}
                {req.booking && (
                  <div className="rounded-lg border border-green-900/50 bg-green-950/40 p-3 space-y-2">
                    <div className="text-xs font-semibold text-green-400">✓ Call Booked</div>
                    <div className="text-xs text-ink-400">
                      With <span className="text-white font-medium">{req.booking.mentor?.name}</span>
                      {" · "}
                      {new Date(req.booking.scheduledAt).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZoneName: "short",
                      })}
                    </div>
                    {req.booking.meetLink && (
                      <a
                        href={req.booking.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mq-btn-primary inline-flex h-8 px-4 text-xs"
                      >
                        🎥 Join Google Meet
                      </a>
                    )}
                  </div>
                )}

                {/* Cancel button */}
                {["PENDING", "MATCHED"].includes(req.status) && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleCancel(req.id)}
                      className="text-xs text-ink-500 hover:text-red-400 transition-colors"
                    >
                      Cancel request
                    </button>
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
