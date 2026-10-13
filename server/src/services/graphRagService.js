import { embedText, cosineSimilarity } from "./embeddingService.js";
import { GraphRepository } from "./graphRepository.js";
import { Paper } from "../models/Paper.js";
import { GraphNode } from "../models/GraphNode.js";
import { GraphEdge } from "../models/GraphEdge.js";
import { logger } from "../utils/logger.js";

/**
 * Graph-RAG: Combines topological knowledge graph walks with dense semantic retrieval.
 * Grounds hypothesis discovery in real paper evidence, avoids LLM hallucination,
 * and traces transparent graph paths between disparate scientific domains.
 */
export class GraphRagService {
  /**
   * Retrieves grounded evidence combining graph traversal and vector similarity.
   *
   * @param {string} sessionId
   * @param {string} queryTopic
   * @param {Object} [options] - { cutoffYear, maxCandidates, maxDepth }
   */
  static async retrieveGroundedContext(sessionId, queryTopic, options = {}) {
    const startTime = Date.now();
    const { cutoffYear, maxCandidates = 10, maxDepth = 3 } = options;

    logger.info(`Graph-RAG retrieval running for "${queryTopic}" (cutoff: ${cutoffYear || "None"})...`);

    // 1. Fetch temporal subgraph snapshot
    const subgraph = await GraphRepository.getSubgraph(sessionId, {
      cutoffYear,
      limit: 1000,
    });

    const papers = await Paper.find({
      sessionId,
      ...(cutoffYear ? { year: { $lte: Number(cutoffYear) } } : {}),
    }).lean();

    // 2. Dense Semantic Search: Embed query topic and find closest papers
    let queryEmbedding = null;
    try {
      queryEmbedding = await embedText(queryTopic);
    } catch (embErr) {
      logger.warn(`Vector embedding unavailable for Graph-RAG (${embErr.message}); proceeding with topological retrieval.`);
    }

    const scoredPapers = papers.map((p) => {
      let sim = 0.5;
      if (queryEmbedding && Array.isArray(p.embedding) && p.embedding.length > 0) {
        sim = cosineSimilarity(queryEmbedding, p.embedding);
      }
      return { ...p, similarity: sim };
    });
    scoredPapers.sort((a, b) => b.similarity - a.similarity);
    const topPapers = scoredPapers.slice(0, 15);

    // 3. Extract methods and problems present in the graph
    const methods = subgraph.nodes.filter((n) => n.nodeType === "Method");
    const problems = subgraph.nodes.filter((n) => n.nodeType === "ResearchProblem");

    // Map existing edges to find which method already addresses which problem
    const existingConnections = new Set(
      subgraph.edges
        .filter((e) => e.edgeType === "ADDRESSES_PROBLEM" || e.edgeType === "USES_METHOD")
        .map((e) => `${e.sourceCanonicalId}->${e.targetCanonicalId}`)
    );

    // 4. Discover Cross-Domain Bridge Candidates:
    // Identify (Method, Problem) pairs that DO NOT currently have a direct edge,
    // but have strong topological connectivity through shared concepts or intermediate papers.
    const candidateBridges = [];
    for (const method of methods.slice(0, 12)) {
      for (const problem of problems.slice(0, 12)) {
        const directKey = `${method.canonicalId}->${problem.canonicalId}`;
        const reverseKey = `${problem.canonicalId}->${method.canonicalId}`;

        if (existingConnections.has(directKey) || existingConnections.has(reverseKey)) {
          continue; // Already directly connected in the literature
        }

        // Trace multi-hop reasoning path
        const paths = await GraphRepository.findPaths(
          sessionId,
          method.canonicalId,
          problem.canonicalId,
          { maxDepth, cutoffYear }
        );

        // Find papers mentioning this method and papers mentioning this problem
        const methodEdges = subgraph.edges.filter(
          (e) => e.targetCanonicalId === method.canonicalId || e.sourceCanonicalId === method.canonicalId
        );
        const problemEdges = subgraph.edges.filter(
          (e) => e.targetCanonicalId === problem.canonicalId || e.sourceCanonicalId === problem.canonicalId
        );

        const supportingPaperIds = Array.from(
          new Set([
            ...methodEdges.map((e) => e.sourcePaperId).filter(Boolean),
            ...problemEdges.map((e) => e.sourcePaperId).filter(Boolean),
          ])
        );

        const evidenceExcerpts = Array.from(
          new Set([
            ...methodEdges.map((e) => e.evidenceText).filter(Boolean),
            ...problemEdges.map((e) => e.evidenceText).filter(Boolean),
          ])
        ).slice(0, 4);

        candidateBridges.push({
          methodNode: method,
          problemNode: problem,
          supportingPaperIds,
          evidenceExcerpts,
          paths,
          pathLength: paths.length > 0 ? paths[0].length : 999,
        });

        if (candidateBridges.length >= maxCandidates * 2) break;
      }
      if (candidateBridges.length >= maxCandidates * 2) break;
    }

    const elapsedMs = Date.now() - startTime;
    logger.info(`Graph-RAG complete: ${candidateBridges.length} bridge candidates in ${elapsedMs}ms.`);

    return {
      topPapers,
      subgraph,
      candidateBridges: candidateBridges.slice(0, maxCandidates),
      diagnostic: {
        totalPapersInSnapshot: papers.length,
        totalNodesInSnapshot: subgraph.nodes.length,
        totalEdgesInSnapshot: subgraph.edges.length,
        cutoffYear: cutoffYear || null,
        latencyMs: elapsedMs,
      },
    };
  }
}
