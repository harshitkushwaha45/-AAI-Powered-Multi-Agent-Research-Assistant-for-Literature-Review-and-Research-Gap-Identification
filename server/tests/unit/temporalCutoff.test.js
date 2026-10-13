import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BacktestingService } from "../../src/services/backtestingService.js";

describe("Temporal Leakage & Historical Snapshot Tests", () => {
  const benchmark = BacktestingService.getStandardScientificBenchmark();

  it("strictly filters future papers and relationships published after the historical cutoff", () => {
    const cutoffYear = 2021;

    // Filter nodes by cutoff
    const preCutoffNodes = benchmark.nodes.filter(
      (n) => (n.firstSeenYear || 2020) <= cutoffYear
    );
    const postCutoffNodes = benchmark.nodes.filter(
      (n) => (n.firstSeenYear || 2020) > cutoffYear
    );

    // Filter edges by cutoff
    const preCutoffEdges = benchmark.edges.filter((e) => e.year <= cutoffYear);
    const postCutoffEdges = benchmark.edges.filter((e) => e.year > cutoffYear);

    // Verify 2024 paper (paper:edge2024) is excluded from pre-cutoff nodes
    assert.ok(
      !preCutoffNodes.some((n) => n.canonicalId === "paper:edge2024"),
      "Paper published in 2024 must NOT be present in <=2021 snapshot!"
    );
    assert.ok(
      postCutoffNodes.some((n) => n.canonicalId === "paper:edge2024"),
      "2024 paper must be in post-cutoff test set."
    );

    // Verify post-cutoff edges (published 2024) do not leak into pre-cutoff edge set
    for (const edge of preCutoffEdges) {
      assert.ok(
        edge.year <= cutoffYear,
        `Edge year ${edge.year} exceeds cutoff ${cutoffYear}`
      );
      assert.notEqual(edge.sourceCanonicalId, "paper:edge2024");
    }

    assert.ok(postCutoffEdges.length > 0, "Post-cutoff edges must exist for held-out evaluation.");
  });

  it("calculates evaluation ranking metrics accurately on deterministic test rankings", () => {
    // 5 test pairs, where only pair 2 and pair 4 are true emergent future connections
    const testPairs = [
      { score: 95, isTrueFutureLink: false },
      { score: 90, isTrueFutureLink: true },  // rank 2 (reciprocal rank = 1/2 = 0.5)
      { score: 80, isTrueFutureLink: false },
      { score: 75, isTrueFutureLink: true },  // rank 4
      { score: 60, isTrueFutureLink: false },
    ];

    const metrics = BacktestingService.computeMetrics(testPairs, "score");

    assert.equal(metrics.mrr, 0.5); // First hit at rank 2
    assert.equal(metrics.hitsAt1, 0); // No hit at rank 1
    assert.equal(metrics.hitsAt3, 1); // Hit at rank 2 is within top 3
    assert.equal(metrics.hitsAt5, 1); // Hits within top 5
    assert.equal(metrics.precisionAt5, 0.4); // 2 out of 5 are positives
    assert.equal(metrics.recallAt5, 1.0); // All 2 positives retrieved within top 5
  });
});
