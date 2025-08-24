// backend/src/controllers/casesController.js
import FormData from "form-data";
import { ai } from "../lib/aiClient.js";

const getUserIdFromReq = (req) =>
  (req.user?.id?.toString()) || req.get("X-User-Id") || "anon";

/**
 * POST /api/cases
 * Forwards the uploaded file to FastAPI /ingest/process
 */
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

/**
 * GET /api/cases/:id/raw  -> FastAPI /cases/{id}/raw
 */
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

/**
 * GET /api/cases/:id/data -> FastAPI /cases/{id}/data
 */
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

/**
 * GET /api/cases/:id/meta -> FastAPI /cases/{id}/meta
 */
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

/**
 * GET /api/cases/:id/export -> FastAPI /cases/{id}/export
 */
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

/**
 * GET /api/cases/:id/cleaned -> FastAPI /cases/{id}/cleaned
 */
export const getCleaned = async (req, res) => {
  const { id } = req.params;
  const userId = getUserIdFromReq(req);
  try {
    const r = await ai.get(`/cases/${id}/cleaned`, {
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
