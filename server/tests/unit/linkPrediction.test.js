import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { LinkPredictionService } from "../../src/services/linkPredictionService.js";

describe("Link Prediction Baselines Unit Tests", () => {
  const mockSubgraph = {
    nodes: [
      { canonicalId: "method:rag", name: "RAG" },
      { canonicalId: "problem:hallucination", name: "Hallucination" },
      { canonicalId: "paper:1", name: "Paper 1" },
      { canonicalId: "paper:2", name: "Paper 2" },
    ],
    edges: [
      { sourceCanonicalId: "method:rag", targetCanonicalId: "paper:1", edgeType: "USES_METHOD", year: 2020 },
      { sourceCanonicalId: "problem:hallucination", targetCanonicalId: "paper:1", edgeType: "ADDRESSES_PROBLEM", year: 2020 },
      { sourceCanonicalId: "method:rag", targetCanonicalId: "paper:2", edgeType: "USES_METHOD", year: 2021 },
      { sourceCanonicalId: "problem:hallucination", targetCanonicalId: "paper:2", edgeType: "ADDRESSES_PROBLEM", year: 2021 },
    ],
  };

  it("calculates static graph baseline metrics (common neighbors, Jaccard, Adamic-Adar)", () => {
    const res = LinkPredictionService.computeStaticGraphBaseline(
      mockSubgraph,
      "method:rag",
      "problem:hallucination"
    );

    assert.equal(res.commonNeighborsCount, 2); // paper:1 and paper:2
    assert.ok(res.jaccardIndex > 0);
    assert.ok(res.staticScore > 0);
  });

  it("calculates temporal baseline with recency and edge velocity", () => {
    const res = LinkPredictionService.computeTemporalBaseline(
      mockSubgraph,
      "method:rag",
      "problem:hallucination",
      2021
    );

    assert.ok(res.temporalVelocity > 0);
    assert.ok(res.temporalScore >= 0 && res.temporalScore <= 100);
  });

  it("computes relation-aware proposed score blending semantic, static, temporal, and evidence", () => {
    const score = LinkPredictionService.computeProposedScore({
      semanticScore: 80,
      staticScore: 70,
      temporalScore: 90,
      evidenceCount: 3,
    });

    assert.ok(score >= 0 && score <= 100);
    // 0.35*80 + 0.30*90 + 0.25*70 + 0.10*75 = 28 + 27 + 17.5 + 7.5 = 80
    assert.equal(score, 80);
  });
});
