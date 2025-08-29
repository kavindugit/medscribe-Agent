import { ai } from "../lib/aiClient.js";

const getUserIdFromReq = (req) =>
  (req.user?.id?.toString()) || req.get("X-User-Id") || "anon";

export const chatWithBot = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const r = await ai.post(
      "chatbot/chat", // FastAPI endpoint
      { user_id: userId, message },
      {
        headers: { "X-User-Id": userId },
        validateStatus: () => true,
        timeout: 30_000,
      }
    );

    return res.status(r.status).json(r.data);
  } catch (err) {
    console.error("chatWithBot error:", err?.message);
    const status = err.response?.status || 502;
    const data = err.response?.data || { error: "Upstream AI service error" };
    return res.status(status).json(data);
  }
};
