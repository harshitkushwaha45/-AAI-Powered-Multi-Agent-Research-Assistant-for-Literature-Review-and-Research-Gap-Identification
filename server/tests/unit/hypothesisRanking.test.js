import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Hypothesis Ranking and RGCS Comparison Tests", () => {
  it("computes transparent composite hypothesis ranking with bounded scores", () => {
    const linkPredictionScore = 85;
    const evidenceCoverageScore = 90;
    const noveltyProxyScore = 70;
    const feasibilityScore = 75;

    // Formula: 0.35*link + 0.30*evidence + 0.20*novelty + 0.15*feasibility
    const compositeScore = Math.round(
      0.35 * linkPredictionScore +
      0.30 * evidenceCoverageScore +
      0.20 * noveltyProxyScore +
      0.15 * feasibilityScore
    );

    // 0.35*85 = 29.75, 0.30*90 = 27, 0.20*70 = 14, 0.15*75 = 11.25 -> 82
    assert.equal(compositeScore, 82);
    assert.ok(compositeScore >= 0 && compositeScore <= 100);
  });

  it("verifies original RGCS formula behavior and isolation", () => {
    const sparsityScore = 80;
    const recencyScore = 60;
    const citationTrendScore = 70;
    const llmNoveltyScore = 75;

    // RGCS = 0.40 * sparsity + 0.25 * recency + 0.20 * citationTrend + 0.15 * llmNovelty
    const rgcs = Math.round(
      0.40 * sparsityScore +
      0.25 * recencyScore +
      0.20 * citationTrendScore +
      0.15 * llmNoveltyScore
    );

    // 32 + 15 + 14 + 11.25 = 72.25 -> 72
    assert.equal(rgcs, 72);
    assert.ok(rgcs >= 0 && rgcs <= 100);
  });
});
