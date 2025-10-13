import userModel from "../models/usermodel.js";
import usageModel from "../models/usageModel.js";
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
      deleteDate.setDate(deleteDate.getDate() + 2); // delete data after +2 days
      break;

    case "PremiumCare":
      expireDate = new Date(now);
      expireDate.setFullYear(expireDate.getFullYear() + 1); // valid 1 year
      deleteDate = new Date(expireDate);
      deleteDate.setDate(deleteDate.getDate() + 2);
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

  // Create if missing
  if (!usage) {
    usage = await usageModel.create({
      userId,
      reportsUploaded: 0,
      agentCalls: 0,
      lastReset: new Date(),
    });
  }

  // Reset counts on plan change
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

    // 🔹 Sync usage record
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

    // 🔹 Sync usage after plan upgrade
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
   🔹 Auto Downgrade Expired Plans (CRON / Manual)
-------------------------- */
export const downgradeExpiredPlans = async (req, res) => {
  try {
    const now = new Date();

    const expiredUsers = await userModel.find({
      planExpireAt: { $lte: now },
      plan: { $ne: "Free" },
    });

    if (!expiredUsers.length)
      return res.json({ success: true, message: "No expired plans found." });

    for (let user of expiredUsers) {
      user.plan = "Free";
      user.planExpireAt = null;
      user.deleteDataAt = null;
      await user.save();

      await syncUsageWithPlan(user.userId, "Free");
    }

    res.json({
      success: true,
      message: `Downgraded ${expiredUsers.length} expired users to Free plan.`,
    });
  } catch (error) {
    console.error("Error downgrading expired plans:", error);
    res.json({ success: false, message: error.message });
  }
};
