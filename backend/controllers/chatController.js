import { ai } from "../lib/aiClient.js";

const getUserIdFromReq = (req) =>
  req.user?.id?.toString() || req.get("X-User-Id") || "anon";

/**
 * POST /api/rag/chat
 * Proxy chat requests to FastAPI RAG service
 */
export const ragChat = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);

    const r = await ai.post("/rag/chat", req.body, {
      headers: { "X-User-Id": userId },
      validateStatus: () => true,
      timeout: 60_000,
    });

    return res.status(r.status).json(r.data);
  } catch (err) {
    console.error("ragChat error:", err?.message);
    const status = err.response?.status || 502;
    const data = err.response?.data || { error: "Upstream AI service error" };
    return res.status(status).json(data);
  }
};
