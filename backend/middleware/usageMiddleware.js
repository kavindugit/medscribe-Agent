// backend/middleware/usageMiddleware.js
import usageModel from "../models/usageModel.js";
import userModel from "../models/usermodel.js";

// Monthly plan limits
const PLAN_LIMITS = {
  Free: { reports: 3, agents: 15 },
  "Health Pro": { reports: 10, agents: 50 },
  "Premium Care": { reports: Infinity, agents: Infinity },
};

export const checkPlanLimit = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.get("X-User-Id");
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const user = await userModel.findOne({ userId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const plan = user.plan || "Free";
    const limits = PLAN_LIMITS[plan];

    let usage = await usageModel.findOne({ userId });
    if (!usage) {
      usage = await usageModel.create({ userId });
    }

    // Auto-reset every 30 days
    const now = new Date();
    const resetNeeded = now - usage.lastReset > 30 * 24 * 60 * 60 * 1000;
    if (resetNeeded) {
      usage.reportsUploaded = 0;
      usage.agentCalls = 0;
      usage.lastReset = now;
      await usage.save();
    }

    // Check limits
    if (
      usage.reportsUploaded >= limits.reports &&
      limits.reports !== Infinity
    ) {
      return res.status(403).json({
        success: false,
        message: `Upload limit reached for ${plan} plan. Please upgrade.`,
      });
    }

    // Attach usage + plan for controller to update later
    req.userPlan = plan;
    req.userUsage = usage;
    req.planLimits = limits;

    next();
  } catch (err) {
    console.error("checkPlanLimit error:", err.message);
    return res.status(500).json({ success: false, message: "Internal plan check error" });
  }
};
