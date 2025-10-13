import userModel from "../models/usermodel.js";

// 🔹 Helper function to calculate expiry and deletion dates
const calculatePlanDates = (planType) => {
  const now = new Date();
  let expireDate = new Date(now);
  let deleteDate = new Date(now);

  // Define durations for plans
  switch (planType) {
    case "HealthPro":
      expireDate.setMonth(expireDate.getMonth() + 1); // 1 month validity
      deleteDate = new Date(expireDate);
      deleteDate.setDate(deleteDate.getDate() + 2); // delete data after 2 days of expiry
      break;

    case "PremiumCare":
      expireDate.setFullYear(expireDate.getFullYear() + 1); // 1-year validity
      deleteDate = new Date(expireDate);
      deleteDate.setDate(deleteDate.getDate() + 2);
      break;

    default: // Free plan
      expireDate = null;
      deleteDate = null;
      break;
  }

  return { expireDate, deleteDate };
};

// 🔹 Controller to handle plan update (after payment or manual upgrade)
export const updateUserPlan = async (req, res) => {
  try {
    const { userId, planType, paymentStatus } = req.body;

    if (!userId || !planType) {
      return res.json({ success: false, message: "User ID and plan type are required." });
    }

    // For now, allow dummy payment verification
    if (paymentStatus !== "success") {
      return res.json({ success: false, message: "Payment not completed or failed." });
    }

    const user = await userModel.findOne({ userId });

    if (!user) {
      return res.json({ success: false, message: "User not found." });
    }

    // Calculate plan dates
    const { expireDate, deleteDate } = calculatePlanDates(planType);

    // Update user's plan info
    user.plan = planType;
    user.planExpireAt = expireDate;
    user.deleteDataAt = deleteDate;

    await user.save();

    res.json({
      success: true,
      message: `Plan updated successfully to ${planType}`,
      updatedPlan: {
        plan: user.plan,
        planExpireAt: user.planExpireAt,
        deleteDataAt: user.deleteDataAt,
      },
    });
  } catch (error) {
    console.error("Error updating user plan:", error);
    res.json({ success: false, message: error.message });
  }
};

// 🔹 Controller to simulate payment (dummy gateway for testing)
export const simulatePayment = async (req, res) => {
  try {
    const { userId, planType } = req.body;

    if (!userId || !planType) {
      return res.json({ success: false, message: "User ID and plan type are required." });
    }

    // Simulate a successful payment process
    console.log(`💳 Simulating payment for ${userId}, plan: ${planType}`);

    // Automatically mark as paid and call updateUserPlan internally
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

    if (!updatedUser) {
      return res.json({ success: false, message: "User not found." });
    }

    return res.json({
      success: true,
      message: `Payment successful and plan upgraded to ${planType}`,
      user: {
        userId: updatedUser.userId,
        plan: updatedUser.plan,
        planExpireAt: updatedUser.planExpireAt,
        deleteDataAt: updatedUser.deleteDataAt,
      },
    });
  } catch (error) {
    console.error("Error simulating payment:", error);
    res.json({ success: false, message: error.message });
  }
};

// 🔹 Controller to downgrade user plan automatically after expiry (for CRON job or manual)
export const downgradeExpiredPlans = async (req, res) => {
  try {
    const now = new Date();

    const expiredUsers = await userModel.find({
      planExpireAt: { $lte: now },
      plan: { $ne: "Free" },
    });

    if (expiredUsers.length === 0) {
      return res.json({ success: true, message: "No expired plans found." });
    }

    for (let user of expiredUsers) {
      user.plan = "Free";
      user.planExpireAt = null;
      user.deleteDataAt = null;
      await user.save();
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
