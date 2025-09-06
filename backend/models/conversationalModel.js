import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  user_id: {
    type: String, // reference to users.userId
    required: true,
  },
  case_id: {
    type: String, // reference to cases._id
    required: false, // sometimes chat may not be tied to a specific case
  },
  query: {
    type: String, // user message
    required: true,
  },
  answer: {
    type: String, // chatbot response
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now, // auto add time of conversation
  },
});

// ✅ Create model (reuse if already registered)
const conversationModel =
  mongoose.models.Conversations || mongoose.model("Conversations", conversationSchema);

export default conversationModel;
