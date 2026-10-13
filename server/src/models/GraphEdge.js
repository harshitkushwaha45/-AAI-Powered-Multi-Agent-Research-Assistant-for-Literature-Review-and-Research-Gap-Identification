import mongoose from "mongoose";
import { VALID_NODE_TYPES, VALID_RELATIONSHIPS } from "../utils/provenanceValidator.js";

const graphEdgeSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResearchSession",
      required: true,
      index: true,
    },
    edgeType: {
      type: String,
      enum: VALID_RELATIONSHIPS,
      required: true,
      index: true,
    },
    sourceCanonicalId: {
      type: String,
      required: true,
      index: true,
    },
    targetCanonicalId: {
      type: String,
      required: true,
      index: true,
    },
    sourceNodeType: {
      type: String,
      enum: VALID_NODE_TYPES,
      required: true,
    },
    targetNodeType: {
      type: String,
      enum: VALID_NODE_TYPES,
      required: true,
    },
    year: {
      type: Number,
      required: true,
      index: true,
    },
    confidence: {
      type: Number,
      default: 0.8,
      min: 0,
      max: 1,
    },
    evidenceText: {
      type: String,
      default: "",
    },
    sourcePaperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paper",
    },
    sourcePaperExternalId: {
      type: String,
      default: "",
    },
    sourceUrl: {
      type: String,
      default: "",
    },
    extractionMethod: {
      type: String,
      enum: ["bibliographic_metadata", "gemini_structured_extraction", "regex_rule"],
      default: "gemini_structured_extraction",
    },
    verificationStatus: {
      type: String,
      enum: ["observed", "inferred", "verified"],
      default: "inferred",
    },
  },
  { timestamps: true }
);

// Idempotent relationship definition: only one edge of given type between two nodes per session
graphEdgeSchema.index(
  { sessionId: 1, edgeType: 1, sourceCanonicalId: 1, targetCanonicalId: 1 },
  { unique: true }
);
graphEdgeSchema.index({ sessionId: 1, year: 1 });

export const GraphEdge = mongoose.model("GraphEdge", graphEdgeSchema);
