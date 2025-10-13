import mongoose from "mongoose";

const usageSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  reportsUploaded: { type: Number, default: 0 },
  agentCalls: { type: Number, default: 0 },
  lastReset: { type: Date, default: Date.now },
});



const usageModel = mongoose.models.usage || mongoose.model('Usage', usageSchema);
export default usageModel;