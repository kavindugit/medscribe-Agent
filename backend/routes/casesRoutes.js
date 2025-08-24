import express from "express";
import multer from "multer";
import {
  createCase,
  getCaseRaw,
  getCaseData,
  getCaseMeta,
  exportCase,
} from "../controllers/casesController.js";

const MAX_UPLOAD_MB = parseInt(process.env.MAX_UPLOAD_MB || "25", 10);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 } });

const casesRouter = express.Router();
casesRouter.post("/", upload.single("file"), createCase);
casesRouter.get("/:id/raw", getCaseRaw);
casesRouter.get("/:id/data", getCaseData);
casesRouter.get("/:id/meta", getCaseMeta);
casesRouter.get("/:id/export", exportCase);

export default casesRouter;
