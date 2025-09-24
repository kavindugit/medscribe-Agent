import axios from "axios";

const agentsAPI = axios.create({
  baseURL: "http://localhost:8001", // Agents backend (FastAPI)
  timeout: 120_000,
});

/**
 * POST /api/pipeline/run
 * Proxy request to FastAPI pipeline service
 */
export const runPipeline = async (req, res) => {
  try {
    const r = await agentsAPI.post("/pipeline/run", req.body, {
      headers: { "Content-Type": "application/json" },
      validateStatus: () => true, // forward all statuses
      responseType: "stream", // important for SSE streaming
    });

    // Set headers for streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Pipe the stream directly from FastAPI to frontend
    r.data.pipe(res);
  } catch (err) {
    console.error("runPipeline error:", err?.message);
    const status = err.response?.status || 502;
    const data = err.response?.data || { error: "Pipeline service error" };
    return res.status(status).json(data);
  }
};
