import express from "express";
import { chatWithBot } from "../controllers/chatbotController.js";

const chatbotRouter = express.Router();

// POST /api/chatbot/chat
chatbotRouter.post("/chat", chatWithBot);

export default chatbotRouter;
