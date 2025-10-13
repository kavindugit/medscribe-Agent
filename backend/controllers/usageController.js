// backend/controllers/usageController.js
import usageModel from "../models/usageModel.js";
import userModel from "../models/usermodel.js";
import { getPlanLimits } from "../config/planConfig.js";

export const getUsageStats = async (req, res) => {
  try {
    // ✅ Accept userId from middleware or headers
    const userId = req.user?.id || req.userId || req.get("X-User-Id");
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // ✅ Fetch user record
    const user = await userModel.findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ✅ Ensure plan key consistency (Free, HealthPro, PremiumCare)
    const planType = user.plan || "Free";
    const limits = getPlanLimits(planType);

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

    // ✅ Compute remaining quotas
    const remainingReports =
      limits.reports === Infinity ? "∞" : Math.max(0, limits.reports - usage.reportsUploaded);
    const remainingAgents =
      limits.agents === Infinity ? "∞" : Math.max(0, limits.agents - usage.agentCalls);

    // ✅ Respond with full structured stats
    return res.status(200).json({
      success: true,
      data: {
        userId,
        plan: planType,
        reportsUploaded: usage.reportsUploaded,
        agentCalls: usage.agentCalls,
        remainingReports,
        remainingAgents,
        totalReportsAllowed: limits.reports === Infinity ? "∞" : limits.reports,
        totalAgentsAllowed: limits.agents === Infinity ? "∞" : limits.agents,
        lastReset: usage.lastReset,
      },
    });
  } catch (error) {
    console.error("getUsageStats error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
