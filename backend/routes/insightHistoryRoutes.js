// backend/routes/insightHistoryRoutes.js
import express from "express";
import { getUserInsightsHistory } from "../controllers/insightHistoryController.js";
const insightRouter = express.Router();

insightRouter.get("/:userId", getUserInsightsHistory);

export default insightRouter;
