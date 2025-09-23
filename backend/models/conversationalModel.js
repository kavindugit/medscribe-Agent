// backend/models/conversationModel.js
import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  user_id: {
    type: String, // reference to users.userId
    required: true,
  },
  query: {
    type: String, // user message
    required: true,
  },
  answer: {
    type: String, // chatbot response
    required: true,
  },
  case_ids: {
    type: [String], // optional: store which case(s) were used in RAG
    default: [],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// ✅ Prevent model overwrite in dev
const conversationModel =
  mongoose.models.Conversations ||
  mongoose.model("Conversations", conversationSchema);

export default conversationModel;
