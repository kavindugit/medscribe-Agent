import { ai } from "../lib/aiClient.js";

const getUserIdFromReq = (req) =>
  req.user?.id?.toString() || req.get("X-User-Id") || "anon";

/**
 * GET /api/conversations
 * Fetch conversation history from FastAPI
 */
export const getConversationHistory = async (req, res) => {
  const userId = getUserIdFromReq(req);

  try {
    const r = await ai.get("/conversations", {
      headers: { "X-User-Id": userId },
      validateStatus: () => true,
    });

    return res.status(r.status).json(r.data);
  } catch (err) {
    console.error("getConversationHistory error:", err?.message);
    const status = err.response?.status || 502;
    const data = err.response?.data || { error: "Upstream AI service error" };
    return res.status(status).json(data);
  }
};

/**
 * DELETE /api/conversations
 * Clear conversation history (proxy to FastAPI)
 */
export const clearConversationHistory = async (req, res) => {
  const userId = getUserIdFromReq(req);

  try {
    const r = await ai.delete("/conversations", {
      headers: { "X-User-Id": userId },
      validateStatus: () => true,
    });

    return res.status(r.status).json(r.data);
  } catch (err) {
    console.error("clearConversationHistory error:", err?.message);
    const status = err.response?.status || 502;
    const data = err.response?.data || { error: "Upstream AI service error" };
    return res.status(status).json(data);
  }
};
