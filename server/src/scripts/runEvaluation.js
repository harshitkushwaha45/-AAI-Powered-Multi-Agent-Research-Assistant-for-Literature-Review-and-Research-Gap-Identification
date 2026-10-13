import { connectDB } from "../config/db.js";
import { BacktestingService } from "../services/backtestingService.js";
import { logger } from "../utils/logger.js";

async function main() {
  console.log("==================================================================");
  console.log("ResearchMind: Historical Backtesting & Baseline Evaluation Runner");
  console.log("==================================================================");

  try {
    await connectDB();
    const result = await BacktestingService.runBacktest({
      cutoffYear: 2021,
      evalStartYear: 2022,
      evalEndYear: 2024,
    });

    console.log("\n--- EVALUATION SUMMARY ---");
    console.log(`Benchmark: ${result.benchmarkName}`);
    console.log(`Historical Cutoff: <= ${result.historicalCutoffYear}`);
    console.log(`Evaluation Window: [${result.evaluationWindowStart} - ${result.evaluationWindowEnd}]`);
    console.log(`Total Entities: ${result.totalEntities} | Total Edges: ${result.totalEdges}`);
    console.log(`Verified Future Connections: ${result.verifiedFutureLinks} / ${result.testCandidatePairs}`);
    console.log("\nProposed Relation-Aware + Graph-RAG Metrics:");
    console.log(`  MRR:          ${result.proposedModelMetrics.mrr}`);
    console.log(`  Hits@1:       ${result.proposedModelMetrics.hitsAt1}`);
    console.log(`  Hits@5:       ${result.proposedModelMetrics.hitsAt5}`);
    console.log(`  Hits@10:      ${result.proposedModelMetrics.hitsAt10}`);
    console.log(`  Precision@5:  ${result.proposedModelMetrics.precisionAt5}`);
    console.log(`  Recall@5:     ${result.proposedModelMetrics.recallAt5}`);

    console.log("\nBaseline Comparisons:");
    for (const b of result.baselines) {
      console.log(`  [${b.name}] MRR: ${b.metrics.mrr} | Hits@5: ${b.metrics.hitsAt5} | Precision@5: ${b.metrics.precisionAt5}`);
    }

    console.log("\nAblation Studies:");
    for (const a of result.ablationStudies) {
      console.log(`  [${a.ablationName}] MRR: ${a.metrics.mrr} (Delta MRR: ${a.deltaMrr})`);
    }

    console.log("\nResults written to server/data/evaluations/ directory.");
    process.exit(0);
  } catch (err) {
    logger.error(`Evaluation run failed: ${err.message}`);
    process.exit(1);
  }
}

main();
