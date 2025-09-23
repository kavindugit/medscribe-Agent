// backend/routes/chatRoutes.js
import express from "express";
import { ragChat } from "../controllers/chatController.js";
import { getConversationHistory } from "../controllers/conversationsController.js";
import { clearConversationHistory } from "../controllers/conversationsController.js";

const chatRouter = express.Router();

chatRouter.post("/rag/chat", ragChat);
chatRouter.get("/conversations", getConversationHistory);
chatRouter.delete("/conversations", clearConversationHistory);

export default chatRouter;
