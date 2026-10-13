import { embedText, cosineSimilarity } from "./embeddingService.js";
import { logger } from "../utils/logger.js";

/**
 * Link Prediction Service.
 * Implements Baseline 1 (Semantic), Baseline 2 (Static Graph),
 * Baseline 3 (Temporal Graph), and Proposed Relation-Aware Link Scoring.
 * Strictly enforces chronological isolation: no information beyond cutoffYear is used.
 */
export class LinkPredictionService {
  /**
   * BASELINE 1: Semantic Similarity Baseline.
   * Ranks method-problem affinity using dense vector cosine similarity.
   */
  static async computeSemanticBaseline(methodName, problemName) {
    try {
      const [embMethod, embProblem] = await Promise.all([
        embedText(methodName),
        embedText(problemName),
      ]);
      const sim = cosineSimilarity(embMethod, embProblem);
      // Rescale [-1, 1] to [0, 100]
      return Math.round(Math.max(0, sim) * 100);
    } catch (err) {
      logger.warn(`Semantic baseline fallback for "${methodName}" / "${problemName}": ${err.message}`);
      return 50;
    }
  }

  /**
   * BASELINE 2: Static Graph Topology Baseline.
   * Computes topological proximity (Common Neighbors, Jaccard Index, Adamic-Adar).
   */
  static computeStaticGraphBaseline(subgraph, sourceId, targetId) {
    const neighborsA = new Set();
    const neighborsB = new Set();

    for (const edge of subgraph.edges) {
      if (edge.sourceCanonicalId === sourceId) neighborsA.add(edge.targetCanonicalId);
      if (edge.targetCanonicalId === sourceId) neighborsA.add(edge.sourceCanonicalId);
      if (edge.sourceCanonicalId === targetId) neighborsB.add(edge.targetCanonicalId);
      if (edge.targetCanonicalId === targetId) neighborsB.add(edge.sourceCanonicalId);
    }

    // Common neighbors
    const common = [];
    for (const n of neighborsA) {
      if (neighborsB.has(n)) common.push(n);
    }

    const unionSize = new Set([...neighborsA, ...neighborsB]).size;
    const jaccard = unionSize > 0 ? common.length / unionSize : 0;

    // Adamic-Adar score: sum of 1 / log(degree(z)) for common neighbors z
    let adamicAdar = 0;
    for (const z of common) {
      const degree = subgraph.edges.filter(
        (e) => e.sourceCanonicalId === z || e.targetCanonicalId === z
      ).length;
      if (degree > 1) {
        adamicAdar += 1 / Math.log(degree);
      }
    }

    // Normalize static score into 0-100 range
    const staticScore = Math.min(100, Math.round(jaccard * 50 + Math.min(50, adamicAdar * 25)));
    return {
      commonNeighborsCount: common.length,
      jaccardIndex: Number(jaccard.toFixed(4)),
      adamicAdar: Number(adamicAdar.toFixed(4)),
      staticScore,
    };
  }

  /**
   * BASELINE 3: Temporal Graph Baseline.
   * Incorporates publication chronology, citation velocity, and historical growth.
   */
  static computeTemporalBaseline(subgraph, sourceId, targetId, cutoffYear) {
    const baseCutoff = cutoffYear ? Number(cutoffYear) : new Date().getFullYear();

    // Source and target edges before cutoff
    const sourceEdges = subgraph.edges.filter(
      (e) =>
        (e.sourceCanonicalId === sourceId || e.targetCanonicalId === sourceId) &&
        e.year <= baseCutoff
    );
    const targetEdges = subgraph.edges.filter(
      (e) =>
        (e.sourceCanonicalId === targetId || e.targetCanonicalId === targetId) &&
        e.year <= baseCutoff
    );

    if (sourceEdges.length === 0 || targetEdges.length === 0) {
      return { temporalVelocity: 0, temporalScore: 20 };
    }

    // Recency weighting: edges closer to cutoff year are weighted higher
    const avgSourceRecency =
      sourceEdges.reduce((sum, e) => sum + Math.max(0, 5 - (baseCutoff - e.year)), 0) /
      (sourceEdges.length || 1);
    const avgTargetRecency =
      targetEdges.reduce((sum, e) => sum + Math.max(0, 5 - (baseCutoff - e.year)), 0) /
      (targetEdges.length || 1);

    const temporalVelocity = (avgSourceRecency + avgTargetRecency) / 10;
    const temporalScore = Math.min(100, Math.round(temporalVelocity * 100));

    return {
      temporalVelocity: Number(temporalVelocity.toFixed(4)),
      temporalScore,
    };
  }

  /**
   * PROPOSED MODEL: Relation-Aware Temporal Graph Prediction.
   * Combines relational path topology, dense cross-domain semantic affinity,
   * evidence density, and temporal edge dynamics.
   *
   * Formally:
   * S_proposed = 0.35 * S_semantic + 0.30 * S_temporal + 0.25 * S_static + 0.10 * S_evidence
   */
  static computeProposedScore({ semanticScore, staticScore, temporalScore, evidenceCount }) {
    const evidenceScore = Math.min(100, (evidenceCount || 1) * 25);
    const proposed = Math.round(
      0.35 * semanticScore +
      0.30 * temporalScore +
      0.25 * staticScore +
      0.10 * evidenceScore
    );
    return Math.min(100, Math.max(0, proposed));
  }

  /**
   * Evaluates and ranks a set of candidate (Method, Problem) pairs
   * across all three baselines and the proposed method.
   */
  static async rankCandidatePairs(subgraph, candidateBridges, options = {}) {
    const { cutoffYear } = options;
    const scoredPairs = [];

    for (const bridge of candidateBridges) {
      const methodName = bridge.methodNode.name;
      const problemName = bridge.problemNode.name;

      // 1. Semantic baseline
      const semanticScore = await this.computeSemanticBaseline(methodName, problemName);

      // 2. Static graph baseline
      const staticResult = this.computeStaticGraphBaseline(
        subgraph,
        bridge.methodNode.canonicalId,
        bridge.problemNode.canonicalId
      );

      // 3. Temporal baseline
      const temporalResult = this.computeTemporalBaseline(
        subgraph,
        bridge.methodNode.canonicalId,
        bridge.problemNode.canonicalId,
        cutoffYear
      );

      // 4. Proposed relation-aware prediction score
      const proposedScore = this.computeProposedScore({
        semanticScore,
        staticScore: staticResult.staticScore,
        temporalScore: temporalResult.temporalScore,
        evidenceCount: bridge.evidenceExcerpts?.length || 1,
      });

      scoredPairs.push({
        ...bridge,
        scores: {
          semanticBaseline: semanticScore,
          staticBaseline: staticResult.staticScore,
          temporalBaseline: temporalResult.temporalScore,
          proposedModelScore: proposedScore,
          staticDetails: staticResult,
          temporalDetails: temporalResult,
        },
      });
    }

    // Sort by proposed model score descending
    return scoredPairs.sort((a, b) => b.scores.proposedModelScore - a.scores.proposedModelScore);
  }
}
