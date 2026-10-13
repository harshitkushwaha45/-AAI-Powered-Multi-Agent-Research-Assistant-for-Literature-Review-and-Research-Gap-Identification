import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateObjectIdParam } from "../middleware/validateObjectId.js";
import {
  runBacktestJob,
  listEvaluationRuns,
  getLatestEvaluationRun,
  getEvaluationRun,
} from "../controllers/evaluationController.js";

const router = Router();

router.post("/run", asyncHandler(runBacktestJob));
router.get("/", asyncHandler(listEvaluationRuns));
router.get("/latest", asyncHandler(getLatestEvaluationRun));
router.get("/:id", validateObjectIdParam("id"), asyncHandler(getEvaluationRun));

export default router;
