import mongoose from "mongoose";
import { VALID_NODE_TYPES } from "../utils/provenanceValidator.js";

const graphNodeSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResearchSession",
      required: true,
      index: true,
    },
    nodeType: {
      type: String,
      enum: VALID_NODE_TYPES,
      required: true,
      index: true,
    },
    canonicalId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    firstSeenYear: {
      type: Number,
      index: true,
    },
    sourcePaperIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Paper",
      },
    ],
    properties: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    extractionConfidence: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1,
    },
    verificationStatus: {
      type: String,
      enum: ["observed", "inferred", "verified"],
      default: "inferred",
    },
  },
  { timestamps: true }
);

// Unique canonical node per session
graphNodeSchema.index({ sessionId: 1, canonicalId: 1 }, { unique: true });
graphNodeSchema.index({ sessionId: 1, nodeType: 1, firstSeenYear: 1 });

export const GraphNode = mongoose.model("GraphNode", graphNodeSchema);
