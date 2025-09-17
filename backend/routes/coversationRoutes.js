import express from "express";
import userAuth from "../middleware/userAuth.js";
import { getConversationHistory } from "../controllers/conversationsController.js";

const conversationsRouter = express.Router();

conversationsRouter.get("/:caseId", userAuth, getConversationHistory);

export default conversationsRouter;
