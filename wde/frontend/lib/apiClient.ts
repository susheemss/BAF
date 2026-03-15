import axios from "axios";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8001";
const DEMO_SESSION_TOKEN = "demo-session";

export const apiClient = axios.create({
  baseURL: apiBase,
  timeout: 20000
});

apiClient.interceptors.request.use((config) => {
  if (typeof document !== "undefined") {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("wde_session="));
    const rawToken = cookie ? cookie.slice("wde_session=".length) : "";
    const token = rawToken ? decodeURIComponent(rawToken) : DEMO_SESSION_TOKEN;

    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
