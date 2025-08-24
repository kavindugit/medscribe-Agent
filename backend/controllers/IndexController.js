import { ai } from "../lib/aiClient.js";

export const buildIndexForCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user?.userId || req.headers["x-user-id"] || "anon";

    const r = await ai.post(`/index/build/${caseId}`, null, {
      headers: { "X-User-Id": userId },
      validateStatus: () => true,
    });

    if (r.status >= 400) return res.status(r.status).json(r.data);
    return res.json(r.data);
  } catch (err) {
    console.error("buildIndexForCase error:", err.message);
    return res.status(500).json({ success: false, message: "Index build failed" });
  }
};
