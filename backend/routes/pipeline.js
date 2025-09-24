import express from "express";
import { runPipeline } from "../controllers/agentController.js";

const AgentRouter = express.Router();

// API route -> proxy to FastAPI
AgentRouter.post("/run", runPipeline);

export default AgentRouter;
