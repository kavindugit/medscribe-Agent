import express from "express";
import multer from "multer";
import userAuth from "../middleware/userAuth.js";
import {
  createCase,
  getCaseRaw,
  getCaseData,
  getCaseMeta,
  exportCase,
  getCleaned,
} from "../controllers/casesController.js";

const MAX_UPLOAD_MB = parseInt(process.env.MAX_UPLOAD_MB || "25", 10);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 } });

const casesRouter = express.Router();
casesRouter.post("/", upload.single("file"), createCase);
casesRouter.get("/:id/raw", userAuth , getCaseRaw);
casesRouter.get("/:id/data", userAuth , getCaseData);
casesRouter.get("/:id/meta", userAuth , getCaseMeta);
casesRouter.get("/:id/export", userAuth , exportCase);
casesRouter.get("/:id/cleaned", userAuth , getCleaned);

export default casesRouter;
