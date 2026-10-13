import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateObjectIdParam } from "../middleware/validateObjectId.js";
import {
  getSubgraph,
  getGraphStats,
  findGraphPaths,
  verifyGraphIntegrity,
} from "../controllers/graphController.js";

const router = Router();

router.get("/:id", validateObjectIdParam("id"), asyncHandler(getSubgraph));
router.get("/:id/stats", validateObjectIdParam("id"), asyncHandler(getGraphStats));
router.get("/:id/paths", validateObjectIdParam("id"), asyncHandler(findGraphPaths));
router.get("/:id/integrity", validateObjectIdParam("id"), asyncHandler(verifyGraphIntegrity));

export default router;
