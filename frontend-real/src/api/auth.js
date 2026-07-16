import { api, post } from "./client.js";

export async function login(data) {
  return post("/api/auth/login", data);
}

export async function me() {
  return api("GET", `/api/auth/me?_=${Date.now()}`, null, { skipAuthRedirect: true });
}
