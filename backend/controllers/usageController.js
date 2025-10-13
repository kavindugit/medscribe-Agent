// backend/controllers/usageController.js
import usageModel from "../models/usageModel.js";
import userModel from "../models/usermodel.js";

export const getUsageStats = async (req, res) => {
  try {
    const userId = req.user?.userId || req.get("X-User-Id");
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const user = await userModel.findOne({ userId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const usage = await usageModel.findOne({ userId });
    if (!usage)
      return res.status(200).json({
        success: true,
        data: {
          userId,
          plan: user.plan,
          reportsUploaded: 0,
          agentCalls: 0,
          remainingReports:
            user.plan === "Premium Care" ? "∞" : user.plan === "Health Pro" ? 10 : 3,
          remainingAgents:
            user.plan === "Premium Care" ? "∞" : user.plan === "Health Pro" ? 50 : 15,
        },
      });

    // Define limits
    const limits = {
      Free: { reports: 3, agents: 15 },
      "Health Pro": { reports: 10, agents: 50 },
      "Premium Care": { reports: Infinity, agents: Infinity },
    }[user.plan || "Free"];

    const remainingReports =
      limits.reports === Infinity ? "∞" : Math.max(0, limits.reports - usage.reportsUploaded);
    const remainingAgents =
      limits.agents === Infinity ? "∞" : Math.max(0, limits.agents - usage.agentCalls);

    return res.json({
      success: true,
      data: {
        userId,
        plan: user.plan,
        reportsUploaded: usage.reportsUploaded,
        agentCalls: usage.agentCalls,
        remainingReports,
        remainingAgents,
        lastReset: usage.lastReset,
      },
    });
  } catch (error) {
    console.error("getUsageStats error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
