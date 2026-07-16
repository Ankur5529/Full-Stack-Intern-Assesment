import { get, post, put, api } from "./client.js";

export async function listUsers(params = {}) {
  const q = new URLSearchParams(params).toString();
  return get(`/api/users${q ? `?${q}` : ""}`);
}

export async function listMentors() {
  return get("/api/mentors");
}

export async function updateMentorProfile(id, data) {
  return api("PUT", `/api/mentors/${id}/profile`, data);
}

export async function createUser(data) {
  return post("/api/admin/create-user", data);
}

export async function getAvailabilityForUser(userId, weekStart) {
  const q = weekStart ? `?weekStart=${weekStart}` : "";
  return get(`/api/admin/availability/${userId}${q}`);
}

export async function getOverlappingSlots(userId, startTime, endTime) {
  const q = new URLSearchParams({ startTime, endTime }).toString();
  return get(`/api/admin/availability/${userId}/overlap?${q}`);
}

// ─── Recommendations ─────────────────────────────────────────────────────────

export async function getRecommendations(callRequestId, weekStart) {
  const q = weekStart ? `?weekStart=${weekStart}` : "";
  return get(`/api/recommendations/${callRequestId}${q}`);
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export async function createBooking(data) {
  return post("/api/bookings", data);
}

export async function listBookings(params = {}) {
  const q = new URLSearchParams(params).toString();
  return get(`/api/bookings${q ? `?${q}` : ""}`);
}

export async function updateBookingStatus(bookingId, status) {
  return api("PATCH", `/api/bookings/${bookingId}/status`, { status });
}

// ─── Call Requests ────────────────────────────────────────────────────────────

export async function listCallRequests(params = {}) {
  const q = new URLSearchParams(params).toString();
  return get(`/api/call-requests${q ? `?${q}` : ""}`);
}

export async function updateCallRequestStatus(id, status) {
  return api("PATCH", `/api/call-requests/${id}`, { status });
}

export async function cancelRequest(id) {
  return api("DELETE", `/api/call-requests/${id}`);
}

// Legacy compat — AdminDashboard still calls this; route to bookings
export async function scheduleMeeting(data) {
  // The old AdminDashboard form maps to a direct booking via the new API.
  // Pass the needed fields through. Callers should migrate to createBooking.
  return post("/api/bookings", data);
}
