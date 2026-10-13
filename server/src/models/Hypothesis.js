import mongoose from "mongoose";

const graphPathStepSchema = new mongoose.Schema(
  {
    from: String,
    relationship: String,
    to: String,
  },
  { _id: false }
);

const scoreBreakdownSchema = new mongoose.Schema(
  {
    linkPredictionScore: { type: Number, default: 0 }, // Score from baseline/GNN link prediction model (0-100)
    evidenceCoverageScore: { type: Number, default: 0 }, // Density and quality of supporting literature citations (0-100)
    noveltyProxyScore: { type: Number, default: 0 }, // Graph sparsity / cross-domain distance (0-100)
    feasibilityScore: { type: Number, default: 0 }, // Absence of severe contradictions / domain compatibility (0-100)
  },
  { _id: false }
);

const hypothesisSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResearchSession",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    statement: { type: String, required: true },
    sourceDomains: [{ type: String }],
    targetDomain: { type: String },
    candidateMethod: { type: String, required: true },
    targetProblem: { type: String, required: true },
    scientificRationale: { type: String, required: true },
    supportingPaperIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Paper" }],
    supportingPaperTitles: [{ type: String }],
    evidenceExcerpts: [{ type: String }],
    graphPaths: [[graphPathStepSchema]],
    limitations: [{ type: String }],
    counterevidence: [{ type: String }],
    feasibilityConsiderations: { type: String, default: "" },
    recommendedValidationExperiment: { type: String, default: "" },
    scoreBreakdown: scoreBreakdownSchema,
    compositeScore: { type: Number, min: 0, max: 100, required: true },
    // Retain original RGCS score alongside upgraded composite score for side-by-side comparison
    rgcsScore: { type: Number, min: 0, max: 100, default: 0 },
    historicalCutoffYear: { type: Number },
    verificationStatus: {
      type: String,
      enum: ["unverified_candidate", "empirically_tested", "historically_validated", "contradicted"],
      default: "unverified_candidate",
    },
  },
  { timestamps: true }
);

hypothesisSchema.index({ sessionId: 1, compositeScore: -1 });

export const Hypothesis = mongoose.model("Hypothesis", hypothesisSchema);
