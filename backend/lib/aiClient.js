import axios from "axios";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;            // e.g. http://127.0.0.1:8001
const AI_SERVICE_TOKEN = process.env.AI_SERVICE_TOKEN || "";  // optional

export const ai = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 60_000,
});

ai.interceptors.request.use((cfg) => {
  if (AI_SERVICE_TOKEN) cfg.headers.Authorization = `Bearer ${AI_SERVICE_TOKEN}`;
  return cfg;
});
