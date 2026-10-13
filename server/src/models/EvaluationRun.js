import mongoose from "mongoose";

const metricScoreSchema = new mongoose.Schema(
  {
    precisionAt1: Number,
    precisionAt3: Number,
    precisionAt5: Number,
    precisionAt10: Number,
    recallAt5: Number,
    recallAt10: Number,
    mrr: Number, // Mean Reciprocal Rank
    hitsAt1: Number,
    hitsAt3: Number,
    hitsAt5: Number,
    hitsAt10: Number,
    evidenceCoverage: Number,
    citationAccuracy: Number,
  },
  { _id: false }
);

const baselineComparisonSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    metrics: metricScoreSchema,
    executionTimeMs: Number,
  },
  { _id: false }
);

const ablationResultSchema = new mongoose.Schema(
  {
    ablationName: { type: String, required: true },
    variation: String,
    metrics: metricScoreSchema,
    deltaMrr: Number,
  },
  { _id: false }
);

const evaluationRunSchema = new mongoose.Schema(
  {
    benchmarkName: { type: String, required: true },
    datasetVersion: { type: String, default: "v1.0-historical" },
    historicalCutoffYear: { type: Number, required: true },
    evaluationWindowStart: { type: Number, required: true },
    evaluationWindowEnd: { type: Number, required: true },
    totalPapers: { type: Number, required: true },
    totalEntities: { type: Number, required: true },
    totalEdges: { type: Number, required: true },
    testCandidatePairs: { type: Number, required: true },
    verifiedFutureLinks: { type: Number, required: true },
    proposedModelMetrics: metricScoreSchema,
    baselines: [baselineComparisonSchema],
    ablationStudies: [ablationResultSchema],
    parameters: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    runTimestamp: { type: Date, default: Date.now },
    notes: String,
  },
  { timestamps: true }
);

export const EvaluationRun = mongoose.model("EvaluationRun", evaluationRunSchema);
