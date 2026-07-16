import { get, post, api } from "./client.js";

export async function listMyRequests() {
  return get("/api/call-requests");
}

export async function createRequest(data) {
  return post("/api/call-requests", data);
}

export async function cancelRequest(id) {
  return api("DELETE", `/api/call-requests/${id}`);
}
