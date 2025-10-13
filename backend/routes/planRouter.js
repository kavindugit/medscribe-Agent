import express from "express";
import userAuth from "../middleware/userAuth.js";

import {
  updateUserPlan,
  simulatePayment,
  downgradeExpiredPlans,
} from "../controllers/planController.js";

const planRouter = express.Router();

planRouter.post("/update", userAuth, updateUserPlan);

planRouter.post("/simulate", userAuth, simulatePayment);

planRouter.post("/downgrade", downgradeExpiredPlans);

export default planRouter;
