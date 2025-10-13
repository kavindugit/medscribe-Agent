import express from "express";
import userAuth from "../middleware/userAuth.js";
import { getUsageStats } from "../controllers/usageController.js";

const usageRouter = express.Router();

usageRouter.get("/stats", userAuth, getUsageStats);

export default usageRouter;
