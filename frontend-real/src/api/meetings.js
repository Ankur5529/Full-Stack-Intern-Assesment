import { get, del, api } from "./client.js";

export async function listMeetings(params = {}) {
  const q = new URLSearchParams(params).toString();
  return get(`/api/bookings${q ? `?${q}` : ""}`);
}

export async function deleteMeeting(meetingId) {
  return api("PATCH", `/api/bookings/${meetingId}/status`, { status: "CANCELLED" });
}
