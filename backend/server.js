// backend/server.js
import express from "express";
import cors from "cors";
import 'dotenv/config';
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";

import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRouter.js";
import casesRouter from "./routes/casesRoutes.js";
import indexRouter from "./routes/indexRoutes.js";
import chatRouter from "./routes/chatRoutes.js";
import AgentRouter from "./routes/pipeline.js";
import planRouter from "./routes/planRouter.js";
import usageRouter from "./routes/usageRouter.js";
import insightRouter from "./routes/insightHistoryRoutes.js"; // ✅ new insights route

import cron from "node-cron";  // ✅ new
import { downgradeExpiredPlans } from "./controllers/planController.js"; // ✅ import your controller

// Initialize app
const app = express();
const PORT = process.env.PORT || 4000;
connectDB();

// Middleware setup
const allowedOrigins = ['http://localhost:5173'];
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Routers
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/cases', casesRouter);
app.use('/api/index', indexRouter);
app.use('/api/chat', chatRouter);
app.use('/api/pipeline', AgentRouter);
app.use('/api/plan', planRouter);
app.use('/api/usage', usageRouter);
app.use('/api/insights', insightRouter); // ✅ new insights route

// ✅ CRON JOB (runs every midnight)
cron.schedule("0 0 * * *", async () => {
  console.log("🕛 Running automatic plan expiry check...");
  try {
    // Call downgradeExpiredPlans() manually
    await downgradeExpiredPlans(
      { body: {} }, // mock request
      {
        json: (result) =>
          console.log("✅ Auto Plan Downgrade Result:", result.message),
      }
    );
  } catch (err) {
    console.error("❌ Auto downgrade failed:", err.message);
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
