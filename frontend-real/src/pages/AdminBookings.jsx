import { useState, useEffect, useCallback } from "react";
import * as adminApi from "../api/admin";

const CALL_TYPES = {
  RESUME_REVAMP: { label: "Resume Revamp", emoji: "📄" },
  JOB_MARKET_GUIDANCE: { label: "Job Market Guidance", emoji: "🗺️" },
  MOCK_INTERVIEW: { label: "Mock Interview", emoji: "🎤" },
};

const STATUS_STYLES = {
  SCHEDULED: "bg-blue-950/60 text-blue-400 border border-blue-900/50",
  COMPLETED: "bg-green-950/60 text-green-400 border border-green-900/50",
  CANCELLED: "bg-white/[0.04] text-ink-500 border border-white/[0.06]",
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [updating, setUpdating] = useState(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.listBookings(filter !== "ALL" ? { status: filter } : {});
      setBookings(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  const updateStatus = async (bookingId, status) => {
    setUpdating(bookingId);
    try {
      await adminApi.updateBookingStatus(bookingId, status);
      loadBookings();
    } catch (err) {
      setError(err?.data?.error || "Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  // Group bookings by date
  const grouped = bookings.reduce((acc, b) => {
    const dateKey = new Date(b.scheduledAt).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(b);
    return acc;
  }, {});

  const stats = {
    total: bookings.length,
    scheduled: bookings.filter((b) => b.status === "SCHEDULED").length,
    completed: bookings.filter((b) => b.status === "COMPLETED").length,
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Scheduled Meetings</h1>
        <p className="text-sm text-ink-400 mt-0.5">All booked mentoring sessions.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Booked", value: stats.total, emoji: "📆" },
          { label: "Upcoming", value: stats.scheduled, emoji: "⏰" },
          { label: "Completed", value: stats.completed, emoji: "✅" },
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

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-navy-800/60 border border-white/[0.06] w-fit">
        {["ALL", "SCHEDULED", "COMPLETED", "CANCELLED"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === s
                ? "bg-white/[0.1] text-white"
                : "text-ink-400 hover:text-ink-50"
            }`}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/60 border border-red-900/50 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      {/* Bookings */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-ink-500 text-sm">Loading…</div>
      ) : bookings.length === 0 ? (
        <div className="mq-card p-12 text-center space-y-3">
          <div className="text-4xl opacity-30">📭</div>
          <p className="text-sm text-ink-400">No bookings yet</p>
          <p className="text-xs text-ink-500">
            Match users with mentors from the Requests tab.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, dayBookings]) => (
            <div key={date}>
              {/* Date divider */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-white/[0.06]" />
                <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">
                  {date}
                </span>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>

              <div className="space-y-3">
                {dayBookings.map((booking) => {
                  const ct = CALL_TYPES[booking.callType];
                  const scheduledDt = new Date(booking.scheduledAt);
                  const isUpdating = updating === booking.id;

                  return (
                    <div key={booking.id} className="mq-card p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        {/* Time block */}
                        <div className="shrink-0 w-16 text-center px-2 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                          <div className="text-sm font-bold text-white leading-none">
                            {scheduledDt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          <div className="text-[10px] text-ink-500 mt-0.5">UTC</div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-lg leading-none">{ct?.emoji}</span>
                            <span className="text-sm font-semibold text-white">{ct?.label}</span>
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                STATUS_STYLES[booking.status] || STATUS_STYLES.CANCELLED
                              }`}
                            >
                              {booking.status.charAt(0) + booking.status.slice(1).toLowerCase()}
                            </span>
                          </div>

                          <div className="flex gap-4 text-xs text-ink-400 flex-wrap">
                            <span>👤 {booking.user?.name}</span>
                            <span>🧑‍💼 {booking.mentor?.name}</span>
                            <span>⏱ {booking.durationMins} min</span>
                          </div>

                          {booking.meetLink && (
                            <a
                              href={booking.meetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mq-btn-primary inline-flex h-7 px-3 text-xs"
                            >
                              🎥 Join Google Meet
                            </a>
                          )}
                        </div>

                        {/* Status actions */}
                        {booking.status === "SCHEDULED" && (
                          <div className="flex flex-col gap-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => updateStatus(booking.id, "COMPLETED")}
                              className="mq-btn-secondary h-7 px-3 text-xs disabled:opacity-40"
                            >
                              ✓ Complete
                            </button>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => updateStatus(booking.id, "CANCELLED")}
                              className="h-7 px-3 text-xs rounded-lg border border-red-900/50 text-red-400 bg-red-950/40 hover:bg-red-950/70 transition-colors disabled:opacity-40"
                            >
                              ✕ Cancel
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {booking.notes && (
                        <div className="text-xs text-ink-500 bg-white/[0.02] border border-white/[0.04] rounded-lg px-3 py-2">
                          📝 {booking.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
