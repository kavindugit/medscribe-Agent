import { Router } from "express";
import { buildIndexForCase } from "../controllers/indexController.js";
// import auth from "../middleware/auth.js";

const indexRouter = Router();

indexRouter.post("/:caseId/build", /* auth, */ buildIndexForCase);

export default indexRouter;
