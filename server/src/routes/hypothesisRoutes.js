import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateObjectIdParam } from "../middleware/validateObjectId.js";
import {
  getSessionHypotheses,
  exportSessionReport,
} from "../controllers/hypothesisController.js";

const router = Router();

router.get("/:id", validateObjectIdParam("id"), asyncHandler(getSessionHypotheses));
router.get("/:id/export", validateObjectIdParam("id"), asyncHandler(exportSessionReport));

export default router;
