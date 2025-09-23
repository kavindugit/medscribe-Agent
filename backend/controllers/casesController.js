// backend/src/controllers/casesController.js
import FormData from "form-data";
import { ai } from "../lib/aiClient.js";


const getUserIdFromReq = (req) => {
  const userId =
    req.userId || // from your auth middleware
    (req.user && req.user.id) || // if middleware sets req.user
    req.get("X-User-Id") || // if manually passed in header
    "anon"; // fallback
  return String(userId);
};


export const createCase = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please attach a file under 'file'." });
    }
    const userId = getUserIdFromReq(req);

    // Rebuild multipart form for FastAPI
    const form = new FormData();
    form.append("file", req.file.buffer, {
      filename: req.file.originalname || "upload.pdf",
      contentType: req.file.mimetype || "application/pdf",
    });

    const r = await ai.post("/ingest/process", form, {
      headers: {
        ...form.getHeaders(),
        "X-User-Id": userId,
      },
      validateStatus: () => true,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60_000,
    });

    return res.status(r.status).json(r.data);
  } catch (err) {
    const status = err.response?.status || 502;
    const data = err.response?.data || { error: "Upstream AI service error" };
    return res.status(status).json(data);
  }
};

export const getCaseRaw = async (req, res) => {
  const { id } = req.params;
  const userId = getUserIdFromReq(req);
  try {
    const r = await ai.get(`/cases/${id}/raw`, {
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

export const getCaseData = async (req, res) => {
  const { id } = req.params;
  const userId = getUserIdFromReq(req);
  try {
    const r = await ai.get(`/cases/${id}/data`, {
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

export const getCaseMeta = async (req, res) => {
  const { id } = req.params;
  const userId = getUserIdFromReq(req);
  try {
    const r = await ai.get(`/cases/${id}/meta`, {
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


export const exportCase = async (req, res) => {
  const { id } = req.params;
  const userId = getUserIdFromReq(req);
  try {
    const r = await ai.get(`/cases/${id}/export`, {
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

export const getCleaned = async (req, res) => {
  const { id } = req.params;
  const userId = getUserIdFromReq(req);
  try {
    const r = await ai.get(`/cases/${id}/file/cleaned/stream`, {
      headers: { "X-User-Id": userId },
      validateStatus: () => true,
    });
    if (r.status >= 400) return res.status(r.status).json(r.data);
    return res.json(r.data);
  } catch (err) {
    console.error("getCleaned error:", err?.message);
    return res.status(500).json({ detail: "Proxy error" });
  }
};
