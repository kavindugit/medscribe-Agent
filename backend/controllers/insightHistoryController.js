// backend/controllers/insightHistoryController.js
import InsightHistory from "../models/insightHistoryModel.js";

export const getUserInsightsHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await InsightHistory.find({ userId })
      .sort({ createdAt: 1 })
      .limit(20);
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
