// backend/src/routes/chatRoutes.js
import express from "express";
import { ragChat } from "../controllers/chatController.js";

const chatRouter = express.Router();

chatRouter.post("/rag/chat", ragChat);

export default chatRouter;
