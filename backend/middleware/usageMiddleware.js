import usageModel from "../models/usageModel.js";
import userModel from "../models/usermodel.js";
import { getPlanLimits } from "../config/planConfig.js";

/**
 * Middleware: Enforces plan usage limits (uploads, agent calls)
 */
export const checkPlanLimit = async (req, res, next) => {
  try {
    // ✅ Get userId consistently from token or header
    const userId = req.user?.id || req.userId || req.get("X-User-Id");
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized: No user ID" });

    // ✅ Find user
    const user = await userModel.findOne({ userId });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const plan = user.plan || "Free";
    const limits = getPlanLimits(plan); // ✅ Reuse centralized config

    // ✅ Fetch or initialize usage record
    let usage = await usageModel.findOne({ userId });
    if (!usage) {
      usage = await usageModel.create({
        userId,
        reportsUploaded: 0,
        agentCalls: 0,
        lastReset: new Date(),
      });
    }

    // ⏳ Auto-reset usage every 30 days
    const now = new Date();
    const daysSinceReset = (now - usage.lastReset) / (1000 * 60 * 60 * 24);
    if (daysSinceReset >= 30) {
      usage.reportsUploaded = 0;
      usage.agentCalls = 0;
      usage.lastReset = now;
      await usage.save();
    }

    // 🚫 Check upload limits
    if (
      limits.reports !== Infinity &&
      usage.reportsUploaded >= limits.reports
    ) {
      return res.status(403).json({
        success: false,
        message: `Upload limit reached for ${plan} plan. Please upgrade to continue.`,
      });
    }

    // ✅ Attach usage + plan info for controller
    req.userPlan = plan;
    req.userUsage = usage;
    req.planLimits = limits;

    next();
  } catch (err) {
    console.error("checkPlanLimit error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal plan limit check error" });
  }
};
