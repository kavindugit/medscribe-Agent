import axios from "axios";
import FormData from "form-data";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8001";
const AI_SERVICE_TOKEN = process.env.AI_SERVICE_TOKEN;

const getUserIdFromReq = (req) =>
  (req.user?.id?.toString()) || req.get("X-User-Id") || "anon";


export const createCase = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please attach a file under 'file'." });
    }

    const userId = getUserIdFromReq(req);

    // Build multipart body to forward to FastAPI
    const form = new FormData();
    form.append("file", req.file.buffer, {
      filename: req.file.originalname || "upload.pdf",
      contentType: req.file.mimetype || "application/pdf",
    });

    const response = await axios.post(`${AI_SERVICE_URL}/ingest/process`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${AI_SERVICE_TOKEN}`,  // service-to-service token
        "X-User-Id": userId,                          // identity for ownership
      },
      maxBodyLength: Infinity,
      timeout: 60_000,
      validateStatus: () => true, // pass through FastAPI status codes
    });

    return res.status(response.status).json(response.data);
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
    const r = await axios.get(`${AI_SERVICE_URL}/cases/${id}/raw`, {
      headers: {
        Authorization: `Bearer ${AI_SERVICE_TOKEN}`,
        "X-User-Id": userId,
      },
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
    const r = await axios.get(`${AI_SERVICE_URL}/cases/${id}/data`, {
      headers: {
        Authorization: `Bearer ${AI_SERVICE_TOKEN}`,
        "X-User-Id": userId,
      },
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
    const r = await axios.get(`${AI_SERVICE_URL}/cases/${id}/meta`, {
      headers: {
        Authorization: `Bearer ${AI_SERVICE_TOKEN}`,
        "X-User-Id": userId,
      },
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
    const r = await axios.get(`${AI_SERVICE_URL}/cases/${id}/export`, {
      headers: {
        Authorization: `Bearer ${AI_SERVICE_TOKEN}`,
        "X-User-Id": userId,
      },
      validateStatus: () => true,
    });
    return res.status(r.status).json(r.data);
  } catch (err) {
    const status = err.response?.status || 502;
    const data = err.response?.data || { error: "Upstream AI service error" };
    return res.status(status).json(data);
  }
};
