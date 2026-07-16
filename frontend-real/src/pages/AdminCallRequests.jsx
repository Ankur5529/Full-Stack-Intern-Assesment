import { useState, useEffect, useCallback } from "react";
import * as adminApi from "../api/admin";
import AvailabilityDashboard from "../components/AvailabilityDashboard";

const CALL_TYPES = {
  RESUME_REVAMP: { label: "Resume Revamp", emoji: "📄" },
  JOB_MARKET_GUIDANCE: { label: "Job Market Guidance", emoji: "🗺️" },
  MOCK_INTERVIEW: { label: "Mock Interview", emoji: "🎤" },
};

const STATUS_STYLES = {
  PENDING: "bg-yellow-950/60 text-yellow-400 border border-yellow-900/50",
  MATCHED: "bg-blue-950/60 text-blue-400 border border-blue-900/50",
  BOOKED: "bg-green-950/60 text-green-400 border border-green-900/50",
  CANCELLED: "bg-white/[0.04] text-ink-500 border border-white/[0.08]",
};

// ─── Booking Modal ────────────────────────────────────────────────────────────

function BookingModal({ callRequest, mentor, overlappingSlots, onClose, onBooked }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [customTime, setCustomTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleBook = async () => {
    const scheduledAt = selectedSlot?.startTime || customTime;
    if (!scheduledAt) { setError("Select a time slot or enter a custom datetime."); return; }
    setLoading(true);
    setError("");
    try {
      await adminApi.createBooking({
        callRequestId: callRequest.id,
        mentorId: mentor.id,
        scheduledAt,
        notes: notes.trim() || undefined,
      });
      onBooked();
      onClose();
    } catch (err) {
      setError(err?.data?.error || err?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-xl border border-white/[0.1] bg-navy-900 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto mq-scroll">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Book Call</h3>
          <button onClick={onClose} className="mq-btn-icon">✕</button>
        </div>

        {/* Summary */}
        <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3 text-sm space-y-1">
          <div className="flex gap-2">
            <span className="text-ink-500">Session:</span>
            <span className="text-white font-medium">
              {CALL_TYPES[callRequest.callType]?.emoji} {CALL_TYPES[callRequest.callType]?.label}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-ink-500">User:</span>
            <span className="text-white">{callRequest.user?.name}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-ink-500">Mentor:</span>
            <span className="text-white">{mentor.name}</span>
          </div>
        </div>

        {/* Overlapping slots */}
        <div>
          <span className="mq-label">Available overlapping slots</span>
          {overlappingSlots.length === 0 ? (
            <p className="text-xs text-yellow-400 bg-yellow-950/40 border border-yellow-900/40 px-3 py-2 rounded-lg mt-1.5">
              ⚠ No overlapping availability this week. Use a custom datetime below.
            </p>
          ) : (
            <div className="mt-1.5 flex flex-col gap-1.5 max-h-48 overflow-y-auto mq-scroll">
              {overlappingSlots.map((slot, i) => {
                const dt = new Date(slot.startTime);
                const isSelected = selectedSlot?.startTime === slot.startTime;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setSelectedSlot(slot); setCustomTime(""); }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-all ${
                      isSelected
                        ? "border-white/30 bg-white/[0.1] text-white font-medium"
                        : "border-white/[0.06] bg-white/[0.02] text-ink-400 hover:bg-white/[0.05]"
                    }`}
                  >
                    <span>
                      {dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                    <span>{dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} UTC</span>
                    {isSelected && <span className="text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Custom time */}
        <div>
          <label htmlFor="custom-datetime" className="mq-label">
            Or custom datetime (UTC)
          </label>
          <input
            id="custom-datetime"
            type="datetime-local"
            className="mq-input"
            value={customTime}
            onChange={(e) => { setCustomTime(e.target.value); setSelectedSlot(null); }}
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="booking-notes" className="mq-label">
            Notes <span className="text-ink-600 font-normal normal-case">optional</span>
          </label>
          <textarea
            id="booking-notes"
            className="mq-input h-20 py-2 resize-none"
            placeholder="Any notes for the mentor…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-950/60 border border-red-900/50 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="mq-btn-secondary">
            Cancel
          </button>
          <button
            id="confirm-booking-btn"
            type="button"
            onClick={handleBook}
            disabled={loading || (!selectedSlot && !customTime)}
            className="mq-btn-primary"
          >
            {loading ? "Booking…" : "✓ Confirm Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Recommendation Panel ─────────────────────────────────────────────────────

function RecommendationPanel({ callRequest, onBooked }) {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [bookingFor, setBookingFor] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.getRecommendations(callRequest.id);
      setRecs(data.recommendations || []);
      setLoaded(true);
    } catch (err) {
      setError(err?.data?.error || err?.message || "Failed to get recommendations");
    } finally {
      setLoading(false);
    }
  };

  if (!loaded) {
    return (
      <div className="text-center py-6 space-y-2">
        <button
          id={`get-recs-${callRequest.id}`}
          type="button"
          onClick={load}
          disabled={loading}
          className="mq-btn-primary"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Getting recommendations…
            </span>
          ) : (
            "🤖 Get Mentor Recommendations"
          )}
        </button>
        <p className="text-xs text-ink-500">Powered by AI tag + availability matching</p>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  if (recs.length === 0) {
    return (
      <p className="text-sm text-ink-500 text-center py-4">No recommendations found.</p>
    );
  }

  return (
    <div className="space-y-3">
      {recs.map((rec, i) => (
        <div
          key={rec.mentor.id}
          className={`rounded-xl border p-4 space-y-3 transition-all ${
            i === 0
              ? "border-white/20 bg-white/[0.06]"
              : "border-white/[0.08] bg-white/[0.02]"
          }`}
        >
          {/* Top row */}
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-base font-bold text-white">
              {rec.mentor.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-white">{rec.mentor.name}</span>
                {i === 0 && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/[0.1] border border-white/[0.12] text-ink-400">
                    ⭐ Top Pick
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-500 mt-0.5">{rec.mentor.email}</p>
              {/* Tags */}
              <div className="flex gap-1 flex-wrap mt-1.5">
                {rec.mentor.profile?.bigCompany && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/[0.1] text-ink-400">Big Tech</span>
                )}
                {rec.mentor.profile?.seniorDev && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/[0.1] text-ink-400">Senior</span>
                )}
                {rec.mentor.profile?.goodComm && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/[0.1] text-ink-400">Good Comm</span>
                )}
                {rec.mentor.profile?.country && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/[0.1] text-ink-400">
                    🌍 {rec.mentor.profile.country}
                  </span>
                )}
              </div>
            </div>
            {/* Score */}
            <div className="text-right shrink-0">
              <div className="text-xl font-bold text-white leading-none">{rec.score}</div>
              <div className="text-[10px] text-ink-500 mt-0.5">match score</div>
              {/* Score bar */}
              <div className="mt-1.5 h-1 w-16 rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full rounded-full bg-white/50 transition-all duration-700"
                  style={{ width: `${rec.score}%` }}
                />
              </div>
            </div>
          </div>

          {/* AI Reasoning */}
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2">
            <div className="text-[10px] font-semibold text-ink-500 uppercase tracking-wider mb-1">
              🤖 AI Reasoning
            </div>
            <p className="text-xs text-ink-400 leading-relaxed">{rec.reasoning}</p>
          </div>

          {/* Overlap slots */}
          <div>
            <div className="text-[10px] font-semibold text-ink-500 uppercase tracking-wider mb-1.5">
              🗓 Availability Overlap — {rec.availabilityOverlap?.length || 0} slots
            </div>
            {rec.availabilityOverlap?.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {rec.availabilityOverlap.slice(0, 8).map((s, si) => (
                  <span
                    key={si}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-ink-400"
                  >
                    {new Date(s.startTime).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}{" "}
                    {new Date(s.startTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                ))}
                {rec.availabilityOverlap.length > 8 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-ink-500">
                    +{rec.availabilityOverlap.length - 8} more
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-ink-600">No overlap found this week</p>
            )}
          </div>

          <button
            id={`book-with-${rec.mentor.id}`}
            type="button"
            onClick={() => setBookingFor(rec)}
            className="mq-btn-primary h-8 px-4 text-xs"
          >
            📅 Book with {rec.mentor.name.split(" ")[0]}
          </button>
        </div>
      ))}

      {/* Refresh */}
      <button
        type="button"
        onClick={() => { setLoaded(false); setRecs([]); }}
        className="mq-btn-secondary h-8 px-4 text-xs w-full"
      >
        ↺ Refresh Recommendations
      </button>

      {bookingFor && (
        <BookingModal
          callRequest={callRequest}
          mentor={bookingFor.mentor}
          overlappingSlots={bookingFor.availabilityOverlap || []}
          onClose={() => setBookingFor(null)}
          onBooked={onBooked}
        />
      )}
    </div>
  );
}

// ─── User Detail Panel ────────────────────────────────────────────────────────

function UserDetailPanel({ user, onBack, onBooked }) {
  const [expandedReqId, setExpandedReqId] = useState(null);
  const pendingRequests = (user.callRequests || []).filter((r) =>
    ["PENDING", "MATCHED"].includes(r.status)
  );
  const bookedRequests = (user.callRequests || []).filter((r) => r.status === "BOOKED");

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <button type="button" onClick={onBack} className="mq-btn-secondary h-8 px-3 text-xs shrink-0">
          ← Back
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-white truncate">{user.name}</h2>
          <p className="text-xs text-ink-500">{user.email}</p>
          <div className="flex gap-1.5 flex-wrap mt-2">
            {user.userProfile?.isTech && (
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/[0.1] text-ink-400">Tech</span>
            )}
            {user.userProfile?.goodComm && (
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/[0.1] text-ink-400">Good Comm</span>
            )}
            {user.userProfile?.asksQuestions && (
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/[0.1] text-ink-400">Curious</span>
            )}
          </div>
        </div>
      </div>

      {/* Profile description */}
      {user.userProfile?.description && (
        <div className="mq-card p-4">
          <div className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2">Profile</div>
          <p className="text-sm text-ink-400 leading-relaxed">{user.userProfile.description}</p>
        </div>
      )}

      {/* Availability (read-only) */}
      <div className="mq-card p-4">
        <div className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-3">
          📅 Availability
        </div>
        <AvailabilityDashboard
          role="USER"
          viewAs={{ userId: user.id, timezone: user.timezone || "UTC" }}
          readOnly
          embedded
        />
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">
            Pending Requests ({pendingRequests.length})
          </h3>
          {pendingRequests.map((req) => {
            const ct = CALL_TYPES[req.callType];
            const isExpanded = expandedReqId === req.id;
            return (
              <div key={req.id} className="mq-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedReqId(isExpanded ? null : req.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-xl leading-none">{ct?.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{ct?.label}</div>
                    <div className="text-xs text-ink-500 mt-0.5">
                      {new Date(req.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[req.status]}`}>
                    {req.status}
                  </span>
                  <svg
                    className={`h-4 w-4 text-ink-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="border-t border-white/[0.06] p-4 space-y-4">
                    {req.description && (
                      <p className="text-sm text-ink-400 leading-relaxed">{req.description}</p>
                    )}
                    <RecommendationPanel
                      callRequest={{ ...req, user }}
                      onBooked={onBooked}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Booked calls */}
      {bookedRequests.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white">Booked Calls</h3>
          {bookedRequests.map((req) => {
            const ct = CALL_TYPES[req.callType];
            return (
              <div key={req.id} className="mq-card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span>{ct?.emoji}</span>
                  <span className="text-sm font-medium text-white">{ct?.label}</span>
                  <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES.BOOKED}`}>
                    BOOKED
                  </span>
                </div>
                {req.booking && (
                  <div className="text-xs text-ink-400 space-y-1">
                    <div>
                      Mentor: <span className="text-white">{req.booking.mentor?.name}</span>
                    </div>
                    <div>
                      Time:{" "}
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
                        className="mq-btn-primary inline-flex h-7 px-3 text-xs mt-1"
                      >
                        🎥 Join Meet
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pendingRequests.length === 0 && bookedRequests.length === 0 && (
        <p className="text-sm text-ink-500 text-center py-4">
          No call requests for this user.
        </p>
      )}
    </div>
  );
}

// ─── Main Admin Call Requests Page ───────────────────────────────────────────

export default function AdminCallRequests() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("pending"); // "pending" | "all"
  const [selectedUser, setSelectedUser] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.listUsers(search ? { search } : {});
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => loadUsers(), search ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadUsers, search]);

  const filteredUsers =
    filter === "pending"
      ? users.filter((u) => u.callRequests?.length > 0)
      : users;

  const stats = {
    total: users.length,
    withRequests: users.filter((u) => u.callRequests?.length > 0).length,
    totalRequests: users.reduce((s, u) => s + (u.callRequests?.length || 0), 0),
  };

  const handleBooked = () => {
    setSelectedUser(null);
    loadUsers();
  };

  // ── User detail view ──
  if (selectedUser) {
    const fresh = users.find((u) => u.id === selectedUser.id) || selectedUser;
    return (
      <div className="max-w-2xl mx-auto">
        <UserDetailPanel
          user={fresh}
          onBack={() => setSelectedUser(null)}
          onBooked={handleBooked}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Call Requests</h1>
        <p className="text-sm text-ink-400 mt-0.5">
          View user requests, get AI recommendations, and book calls.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Users", value: stats.total, emoji: "👥" },
          { label: "With Pending", value: stats.withRequests, emoji: "📋" },
          { label: "Open Requests", value: stats.totalRequests, emoji: "🔍" },
        ].map((s) => (
          <div key={s.label} className="mq-card p-4 flex items-center gap-3">
            <span className="text-2xl leading-none">{s.emoji}</span>
            <div>
              <div className="text-2xl font-bold text-white leading-none">{s.value}</div>
              <div className="text-xs text-ink-500 mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-500 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            id="user-search"
            type="text"
            className="mq-input pl-9"
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* Filter tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-navy-800/60 border border-white/[0.06]">
          {[
            { id: "pending", label: "Pending Only" },
            { id: "all", label: "All Users" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f.id
                  ? "bg-white/[0.1] text-white"
                  : "text-ink-400 hover:text-ink-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/60 border border-red-900/50 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      {/* User card grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-ink-500 text-sm">Loading…</div>
      ) : filteredUsers.length === 0 ? (
        <div className="mq-card p-12 text-center space-y-2">
          <div className="text-4xl opacity-30">👥</div>
          <p className="text-sm text-ink-400">No users found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredUsers.map((user) => (
            <button
              key={user.id}
              id={`user-card-${user.id}`}
              type="button"
              onClick={() => setSelectedUser(user)}
              className="mq-card p-4 text-left hover:border-white/20 hover:bg-white/[0.04] transition-all space-y-3 group"
            >
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 shrink-0 rounded-full bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-sm font-bold text-white">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate group-hover:text-white/90">
                    {user.name}
                  </div>
                  <div className="text-xs text-ink-500 truncate">{user.email}</div>
                </div>
                <div className="shrink-0">
                  {user.callRequests?.length > 0 ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-950/60 text-yellow-400 border border-yellow-900/50">
                      {user.callRequests.length} pending
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.04] text-ink-500 border border-white/[0.06]">
                      no requests
                    </span>
                  )}
                </div>
              </div>

              {/* Tag chips */}
              <div className="flex gap-1 flex-wrap">
                {user.userProfile?.isTech && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/[0.08] text-ink-500">Tech</span>
                )}
                {user.userProfile?.goodComm && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/[0.08] text-ink-500">Good Comm</span>
                )}
                {user.userProfile?.asksQuestions && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/[0.08] text-ink-500">Curious</span>
                )}
              </div>

              {/* Call type chips */}
              {user.callRequests?.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {user.callRequests.map((req) => {
                    const ct = CALL_TYPES[req.callType];
                    return (
                      <span key={req.id} className="text-[10px] px-2 py-0.5 rounded-full border border-white/[0.06] text-ink-500">
                        {ct?.emoji} {ct?.label}
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="text-xs text-ink-600 group-hover:text-ink-400 transition-colors">
                Click to view & get recommendations →
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
