import mongoose from "mongoose";

const insightHistorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true, // ✅ quick user-based lookups
  },

  caseId: {
    type: String,
    required: true,
  },

  insights: {
    bmi: { type: Number, default: null },
    bp_sys: { type: Number, default: null },
    bp_dia: { type: Number, default: null },
    hba1c: { type: Number, default: null },
    ldl: { type: Number, default: null },
    trend: {
      bmi: { type: String, default: null },
      bp_sys: { type: String, default: null },
      hba1c: { type: String, default: null },
      ldl: { type: String, default: null },
    },
  },

  summary: {
    type: String,
    default: "",
  },

  blobPath: {
    type: String,
    default: "", // ✅ store Azure blob path (cases/{caseId}/insights.json)
  },

  timestamp: {
    type: Date,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true, // ✅ helps for chronological queries
  },
});

// ✅ Add compound index for faster history sorting
insightHistorySchema.index({ userId: 1, createdAt: -1 });

// ✅ Define and export model
const InsightHistory =
  mongoose.models.InsightHistory ||
  mongoose.model("InsightHistory", insightHistorySchema);

export default InsightHistory;
