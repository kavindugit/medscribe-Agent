import userModel from "../models/usermodel.js";
import usageModel from "../models/usageModel.js";
import caseModel from "../models/caseModel.js";
import { ai } from "../lib/aiClient.js"; // ✅ use shared AI client
import { PLAN_LIMITS, getPlanLimits } from "../config/planConfig.js";

/* -------------------------
   🔹 Utility: calculate expiry + deletion dates
-------------------------- */
const calculatePlanDates = (planType) => {
  const now = new Date();
  let expireDate = null;
  let deleteDate = null;

  switch (planType) {
    case "HealthPro":
      expireDate = new Date(now);
      expireDate.setMonth(expireDate.getMonth() + 1); // valid 1 month
      deleteDate = new Date(expireDate);
      deleteDate.setDate(deleteDate.getDate() + 2); // cleanup after +2 days
      break;

    case "PremiumCare":
      expireDate = new Date(now);
      expireDate.setMonth(expireDate.getMonth() + 1); // valid 1 month
      deleteDate = new Date(expireDate);
      deleteDate.setDate(deleteDate.getDate() + 5); // cleanup after +5 days
      break;

    default:
      expireDate = null;
      deleteDate = null;
      break;
  }

  return { expireDate, deleteDate };
};

/* -------------------------
   🔹 Helper: Sync usage record when plan changes
-------------------------- */
const syncUsageWithPlan = async (userId, planType) => {
  const limits = getPlanLimits(planType);
  let usage = await usageModel.findOne({ userId });

  if (!usage) {
    usage = await usageModel.create({
      userId,
      reportsUploaded: 0,
      agentCalls: 0,
      lastReset: new Date(),
    });
  }

  usage.reportsUploaded = 0;
  usage.agentCalls = 0;
  usage.lastReset = new Date();
  await usage.save();

  return { usage, limits };
};

/* -------------------------
   🔹 Controller: Manual or Payment-Based Plan Update
-------------------------- */
export const updateUserPlan = async (req, res) => {
  try {
    const { userId, planType, paymentStatus } = req.body;

    if (!userId || !planType)
      return res.json({ success: false, message: "User ID and plan type are required." });

    if (paymentStatus && paymentStatus !== "success")
      return res.json({ success: false, message: "Payment not completed or failed." });

    const user = await userModel.findOne({ userId });
    if (!user) return res.json({ success: false, message: "User not found." });

    const { expireDate, deleteDate } = calculatePlanDates(planType);

    user.plan = planType;
    user.planExpireAt = expireDate;
    user.deleteDataAt = deleteDate;
    await user.save();

    const { usage } = await syncUsageWithPlan(userId, planType);

    return res.json({
      success: true,
      message: `Plan updated successfully to ${planType}`,
      user: {
        userId: user.userId,
        plan: user.plan,
        planExpireAt: user.planExpireAt,
        deleteDataAt: user.deleteDataAt,
      },
      usage: {
        reportsUploaded: usage.reportsUploaded,
        agentCalls: usage.agentCalls,
      },
    });
  } catch (error) {
    console.error("Error updating user plan:", error);
    res.json({ success: false, message: error.message });
  }
};

/* -------------------------
   🔹 Simulated Payment Endpoint (for testing)
-------------------------- */
export const simulatePayment = async (req, res) => {
  try {
    const { userId, planType } = req.body;

    if (!userId || !planType)
      return res.json({ success: false, message: "User ID and plan type are required." });

    console.log(`💳 Simulating payment for ${userId}, plan: ${planType}`);

    const { expireDate, deleteDate } = calculatePlanDates(planType);

    const updatedUser = await userModel.findOneAndUpdate(
      { userId },
      {
        plan: planType,
        planExpireAt: expireDate,
        deleteDataAt: deleteDate,
      },
      { new: true }
    );

    if (!updatedUser)
      return res.json({ success: false, message: "User not found." });

    const { usage } = await syncUsageWithPlan(userId, planType);

    return res.json({
      success: true,
      message: `Payment successful and plan upgraded to ${planType}`,
      user: {
        userId: updatedUser.userId,
        plan: updatedUser.plan,
        planExpireAt: updatedUser.planExpireAt,
        deleteDataAt: updatedUser.deleteDataAt,
      },
      usage,
    });
  } catch (error) {
    console.error("Error simulating payment:", error);
    res.json({ success: false, message: error.message });
  }
};

/* -------------------------
   🔹 Auto Downgrade Expired Plans + Cleanup DeleteData
-------------------------- */
export const downgradeExpiredPlans = async (req, res) => {
  try {
    const now = new Date();

    // 1️⃣ Find users whose plan expired (need downgrade)
    const expiredUsers = await userModel.find({
      planExpireAt: { $lte: now },
      plan: { $ne: "Free" },
    });

    // 2️⃣ Find users whose deleteDataAt passed (cleanup stage)
    const cleanupUsers = await userModel.find({
      deleteDataAt: { $lte: now, $ne: null },
    });

    // 🔸 Step 1: Downgrade expired plans
    for (const user of expiredUsers) {
      console.log(`⚙️ Downgrading ${user.fullName} (${user.userId}) to Free plan`);

      user.plan = "Free";
      user.planExpireAt = null;
      await user.save();

      await syncUsageWithPlan(user.userId, "Free");
    }

    // 🔸 Step 2: Cleanup expired data
    for (const user of cleanupUsers) {
      console.log(`🧹 Cleaning expired data for ${user.fullName} (${user.userId})`);

      const userCases = await caseModel.find({ userId: user.userId });

      for (const caseDoc of userCases) {
        try {
          // ✅ Delete case files
          await ai.delete(`/cases/${caseDoc.case_id}/delete-files`);
          console.log(`🗑️ Deleted case files for ${caseDoc.case_id}`);

          // ✅ Delete vector indexes
          await ai.delete(`/vector/cleanup/${caseDoc.case_id}`);
          console.log(`🧠 Deleted vector index for ${caseDoc.case_id}`);
        } catch (err) {
          console.warn(`⚠️ Cleanup failed for case ${caseDoc.case_id}: ${err.message}`);
        }
      }

      // ✅ Remove deleteDataAt (mark cleanup complete)
      user.deleteDataAt = null;
      await user.save();
    }

    const totalDowngraded = expiredUsers.length;
    const totalCleaned = cleanupUsers.length;

    return res.json({
      success: true,
      message: `✅ ${totalDowngraded} plans downgraded, ${totalCleaned} user data cleanups completed.`,
    });
  } catch (error) {
    console.error("Error in auto plan downgrade:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
