import mongoose from "mongoose";

const caseSchema = new mongoose.Schema({
  _id: {
    type: String, // UUID (case_id generated in pipeline)
    required: true,
  },
  user_id: {
    type: String, // reference to user.userId
    required: true,
  },
  report_name: {
    type: String,
    required: true,
  },
  hospital: {
    type: String,
    default: "",
  },
  doctor: {
    type: String,
    default: "",
  },
  uploaded_at: {
    type: Date,
    required: true,
  },
  raw_text_path: {
    type: String,
    required: true,
  },
  cleaned_path: {
    type: String,
    required: true,
  },
  panels_path: {
    type: String,
    required: true,
  },
});

// Create model (reuse if already registered)
const caseModel = mongoose.models.Case || mongoose.model("Case", caseSchema);

export default caseModel;
