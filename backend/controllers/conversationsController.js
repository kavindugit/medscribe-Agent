import { ai } from "../lib/aiClient.js";

const getUserIdFromReq = (req) =>
  (req.user?.id?.toString()) || req.get("X-User-Id") || "anon";

/**
 * GET /api/conversations/:caseId
 * Fetch conversation history for a given case
 */
export const getConversationHistory = async (req, res) => {
  const { caseId } = req.params;
  const userId = getUserIdFromReq(req);
  try {
    const r = await ai.get(`/conversations/${caseId}`, {
      headers: { "X-User-Id": userId },
      validateStatus: () => true,
    });
    return res.status(r.status).json(r.data);
  } catch (err) {
    const status = err.response?.status || 502;
    const data = err.response?.data || { error: "Upstream AI service error" };
    return res.status(status).json(data);
  }
};
