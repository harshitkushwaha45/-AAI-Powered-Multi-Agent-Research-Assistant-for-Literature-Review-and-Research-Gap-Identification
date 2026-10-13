import axios from "axios";

// In local development, the Vite dev server proxies "/api" directly to the backend at http://localhost:5000.
// In production (e.g. frontend on Vercel, backend on Render), set VITE_API_BASE_URL to
// the backend's API endpoint, e.g. https://aai-powered-multi-agent-research.onrender.com/api
const rawBase = (import.meta.env.VITE_API_BASE_URL || "/api").trim().replace(/\/+$/, "");
const baseURL = rawBase === "/api" || rawBase.endsWith("/api") ? rawBase : `${rawBase}/api`;
const api = axios.create({ baseURL });

export async function createResearchSession(topic, cutoffYear) {
  const payload = { topic };
  if (cutoffYear) payload.cutoffYear = Number(cutoffYear);
  const { data } = await api.post("/research", payload);
  return data; // { sessionId }
}

export async function fetchSession(sessionId) {
  const { data } = await api.get(`/research/${sessionId}`);
  return data;
}

export async function fetchSessionPapers(sessionId) {
  const { data } = await api.get(`/research/${sessionId}/papers`);
  return data;
}

export async function fetchRecentSessions() {
  const { data } = await api.get("/research");
  return data;
}

export async function deleteSession(sessionId) {
  await api.delete(`/research/${sessionId}`);
}

export async function fetchSubgraph(sessionId, params = {}) {
  const { data } = await api.get(`/graph/${sessionId}`, { params });
  return data;
}

export async function fetchGraphStats(sessionId, params = {}) {
  const { data } = await api.get(`/graph/${sessionId}/stats`, { params });
  return data;
}

export async function fetchHypotheses(sessionId) {
  const { data } = await api.get(`/hypotheses/${sessionId}`);
  return data;
}

export async function exportSessionReport(sessionId, format = "json") {
  const response = await api.get(`/hypotheses/${sessionId}/export`, {
    params: { format },
    responseType: format === "json" ? "json" : "blob",
  });
  return response.data;
}

export async function fetchLatestEvaluation() {
  const { data } = await api.get("/evaluations/latest");
  return data;
}

export async function fetchEvaluationRuns() {
  const { data } = await api.get("/evaluations");
  return data;
}

export async function runBacktest(params = {}) {
  const { data } = await api.post("/evaluations/run", params);
  return data;
}

