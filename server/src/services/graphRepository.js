import { GraphNode } from "../models/GraphNode.js";
import { GraphEdge } from "../models/GraphEdge.js";
import { isNeo4jActive, runCypher } from "./neo4jService.js";
import { validateProvenance, isValidEdgeDefinition } from "../utils/provenanceValidator.js";
import { logger } from "../utils/logger.js";

/**
 * Unified Knowledge Graph Repository.
 * Handles graph persistence, idempotent updates, temporal snapshot filtering,
 * neighborhood expansion, path queries, and integrity checks.
 *
 * Automatically syncs with Neo4j when connected, and maintains full graph
 * integrity and querying via MongoDB collections as a production-grade store.
 */
export class GraphRepository {
  /**
   * Bulk inserts or updates nodes and edges for a session.
   * Ensures idempotency: processing duplicate papers or relationships
   * will never create duplicate nodes or edges.
   *
   * @param {string} sessionId
   * @param {Object} graphData - { nodes: Array, edges: Array }
   * @returns {Promise<{ nodeCount: number, edgeCount: number }>}
   */
  static async bulkInsertGraph(sessionId, { nodes = [], edges = [] }) {
    if (!sessionId) throw new Error("sessionId is required");

    // 1. Prepare and execute node upserts in MongoDB
    const nodeOps = nodes.map((node) => ({
      updateOne: {
        filter: { sessionId, canonicalId: node.canonicalId },
        update: {
          $set: {
            sessionId,
            nodeType: node.nodeType,
            canonicalId: node.canonicalId,
            name: node.name,
            description: node.description || "",
            firstSeenYear: node.firstSeenYear,
            extractionConfidence: node.extractionConfidence ?? 1.0,
            verificationStatus: node.verificationStatus || "inferred",
            properties: node.properties || {},
          },
          $addToSet: {
            sourcePaperIds: { $each: (node.sourcePaperIds || []).filter(Boolean) },
          },
        },
        upsert: true,
      },
    }));

    if (nodeOps.length > 0) {
      await GraphNode.bulkWrite(nodeOps);
    }

    // 2. Filter and validate edges before insertion
    const validEdges = edges.filter(isValidEdgeDefinition);

    const edgeOps = validEdges.map((edge) => {
      const validated = validateProvenance({
        sourcePaperId: edge.sourcePaperId,
        sourcePaperExternalId: edge.sourcePaperExternalId,
        year: edge.year,
        evidenceText: edge.evidenceText,
        sourceUrl: edge.sourceUrl,
        extractionMethod: edge.extractionMethod,
        confidence: edge.confidence,
        verificationStatus: edge.verificationStatus,
      });

      return {
        updateOne: {
          filter: {
            sessionId,
            edgeType: edge.edgeType,
            sourceCanonicalId: edge.sourceCanonicalId,
            targetCanonicalId: edge.targetCanonicalId,
          },
          update: {
            $set: {
              sessionId,
              edgeType: edge.edgeType,
              sourceCanonicalId: edge.sourceCanonicalId,
              targetCanonicalId: edge.targetCanonicalId,
              sourceNodeType: edge.sourceNodeType,
              targetNodeType: edge.targetNodeType,
              year: validated.year,
              confidence: validated.confidence,
              evidenceText: validated.evidenceText,
              sourcePaperId: validated.sourcePaperId,
              sourcePaperExternalId: validated.sourcePaperExternalId,
              sourceUrl: validated.sourceUrl,
              extractionMethod: validated.extractionMethod,
              verificationStatus: validated.verificationStatus,
            },
          },
          upsert: true,
        },
      };
    });

    if (edgeOps.length > 0) {
      await GraphEdge.bulkWrite(edgeOps);
    }

    // 3. Mirror into Neo4j if connected
    if (isNeo4jActive()) {
      try {
        await this.syncToNeo4j(sessionId, nodes, validEdges);
      } catch (neoErr) {
        logger.warn(`Neo4j sync warning for session ${sessionId}: ${neoErr.message}`);
      }
    }

    return {
      nodeCount: nodes.length,
      edgeCount: validEdges.length,
    };
  }

  /**
   * Syncs nodes and edges to Neo4j using idempotent Cypher MERGE queries.
   */
  static async syncToNeo4j(sessionId, nodes, edges) {
    if (!isNeo4jActive()) return;

    // Batch node MERGE
    const nodeCypher = `
      UNWIND $batch AS item
      MERGE (n:Entity { sessionId: $sessionId, canonicalId: item.canonicalId })
      ON CREATE SET
        n.name = item.name,
        n.nodeType = item.nodeType,
        n.firstSeenYear = item.firstSeenYear,
        n.description = item.description,
        n.confidence = item.extractionConfidence,
        n.status = item.verificationStatus
      ON MATCH SET
        n.name = item.name,
        n.firstSeenYear = CASE WHEN item.firstSeenYear < n.firstSeenYear THEN item.firstSeenYear ELSE n.firstSeenYear END
    `;
    await runCypher(nodeCypher, {
      sessionId: String(sessionId),
      batch: nodes.map((n) => ({
        canonicalId: n.canonicalId,
        name: n.name,
        nodeType: n.nodeType,
        firstSeenYear: n.firstSeenYear || 2024,
        description: n.description || "",
        extractionConfidence: n.extractionConfidence ?? 1.0,
        verificationStatus: n.verificationStatus || "inferred",
      })),
    });

    // Batch edge MERGE
    const edgeCypher = `
      UNWIND $batch AS edge
      MATCH (src:Entity { sessionId: $sessionId, canonicalId: edge.sourceCanonicalId })
      MATCH (tgt:Entity { sessionId: $sessionId, canonicalId: edge.targetCanonicalId })
      MERGE (src)-[r:RELATION { edgeType: edge.edgeType }]->(tgt)
      ON CREATE SET
        r.year = edge.year,
        r.confidence = edge.confidence,
        r.evidence = edge.evidenceText,
        r.status = edge.verificationStatus
      ON MATCH SET
        r.confidence = edge.confidence,
        r.year = CASE WHEN edge.year < r.year THEN edge.year ELSE r.year END
    `;
    await runCypher(edgeCypher, {
      sessionId: String(sessionId),
      batch: edges.map((e) => ({
        edgeType: e.edgeType,
        sourceCanonicalId: e.sourceCanonicalId,
        targetCanonicalId: e.targetCanonicalId,
        year: e.year || 2024,
        confidence: e.confidence ?? 0.8,
        evidenceText: (e.evidenceText || "").slice(0, 500),
        verificationStatus: e.verificationStatus || "inferred",
      })),
    });
  }

  /**
   * Retrieves a subgraph for a session with optional temporal cutoff filtering.
   * Strict temporal rule: if cutoffYear is provided, only nodes and edges
   * with year <= cutoffYear are returned.
   *
   * @param {string} sessionId
   * @param {Object} options - { cutoffYear, nodeTypes, limit }
   * @returns {Promise<{ nodes: Array, edges: Array, cutoffYear?: number }>}
   */
  static async getSubgraph(sessionId, options = {}) {
    const { cutoffYear, nodeTypes, limit = 500 } = options;

    const nodeFilter = { sessionId };
    const edgeFilter = { sessionId };

    if (cutoffYear && Number.isInteger(Number(cutoffYear))) {
      const year = Number(cutoffYear);
      nodeFilter.firstSeenYear = { $lte: year };
      edgeFilter.year = { $lte: year };
    }

    if (Array.isArray(nodeTypes) && nodeTypes.length > 0) {
      nodeFilter.nodeType = { $in: nodeTypes };
    }

    const [nodes, edges] = await Promise.all([
      GraphNode.find(nodeFilter).limit(limit).lean(),
      GraphEdge.find(edgeFilter).limit(limit * 2).lean(),
    ]);

    // Ensure edges only link to nodes that exist in this filtered slice
    const validCanonicalIds = new Set(nodes.map((n) => n.canonicalId));
    const consistentEdges = edges.filter(
      (e) =>
        validCanonicalIds.has(e.sourceCanonicalId) &&
        validCanonicalIds.has(e.targetCanonicalId)
    );

    return {
      nodes,
      edges: consistentEdges,
      cutoffYear: cutoffYear ? Number(cutoffYear) : null,
      totalNodes: nodes.length,
      totalEdges: consistentEdges.length,
    };
  }

  /**
   * Finds multi-hop paths connecting a source entity to a target entity or target type.
   * Used by Graph-RAG to construct explainable reasoning chains for candidate hypotheses.
   *
   * @param {string} sessionId
   * @param {string} sourceCanonicalId
   * @param {string} targetCanonicalId
   * @param {Object} options - { maxDepth, cutoffYear }
   */
  static async findPaths(sessionId, sourceCanonicalId, targetCanonicalId, options = {}) {
    const { maxDepth = 3, cutoffYear } = options;
    const subgraph = await this.getSubgraph(sessionId, { cutoffYear, limit: 1000 });

    const adjacency = new Map();
    for (const edge of subgraph.edges) {
      if (!adjacency.has(edge.sourceCanonicalId)) adjacency.set(edge.sourceCanonicalId, []);
      adjacency.get(edge.sourceCanonicalId).push(edge);
    }

    const results = [];
    const queue = [[{ canonicalId: sourceCanonicalId, path: [] }]];
    const visited = new Set();

    while (queue.length > 0 && results.length < 5) {
      const currentPath = queue.shift();
      const lastNode = currentPath[currentPath.length - 1];

      if (lastNode.canonicalId === targetCanonicalId && currentPath.length > 1) {
        results.push(currentPath.map((step) => step.edge || { from: step.canonicalId }));
        continue;
      }

      if (currentPath.length > maxDepth) continue;

      const pathKey = `${lastNode.canonicalId}:${currentPath.length}`;
      if (visited.has(pathKey)) continue;
      visited.add(pathKey);

      const neighbors = adjacency.get(lastNode.canonicalId) || [];
      for (const edge of neighbors) {
        if (!currentPath.some((p) => p.canonicalId === edge.targetCanonicalId)) {
          queue.push([
            ...currentPath,
            {
              canonicalId: edge.targetCanonicalId,
              edge: {
                from: edge.sourceCanonicalId,
                relationship: edge.edgeType,
                to: edge.targetCanonicalId,
                year: edge.year,
                evidence: edge.evidenceText,
              },
            },
          ]);
        }
      }
    }

    return results;
  }

  /**
   * Computes graph summary statistics and topological metrics.
   *
   * @param {string} sessionId
   * @param {Object} [options]
   */
  static async getGraphStats(sessionId, options = {}) {
    const { cutoffYear } = options;
    const subgraph = await this.getSubgraph(sessionId, { cutoffYear, limit: 2000 });

    const nodeTypeDistribution = {};
    for (const node of subgraph.nodes) {
      nodeTypeDistribution[node.nodeType] =
        (nodeTypeDistribution[node.nodeType] || 0) + 1;
    }

    const edgeTypeDistribution = {};
    for (const edge of subgraph.edges) {
      edgeTypeDistribution[edge.edgeType] =
        (edgeTypeDistribution[edge.edgeType] || 0) + 1;
    }

    const totalNodes = subgraph.nodes.length;
    const totalEdges = subgraph.edges.length;
    const possibleEdges = totalNodes > 1 ? (totalNodes * (totalNodes - 1)) / 2 : 1;
    const density = totalNodes > 1 ? totalEdges / possibleEdges : 0;

    return {
      sessionId,
      totalNodes,
      totalEdges,
      density: Number(density.toFixed(4)),
      nodeTypeDistribution,
      edgeTypeDistribution,
      cutoffYear: cutoffYear || null,
      neo4jConnected: isNeo4jActive(),
    };
  }

  /**
   * Performs an integrity check on the graph for a session.
   * Detects dangling edges, self-loops, and missing provenance.
   *
   * @param {string} sessionId
   */
  static async verifyIntegrity(sessionId) {
    const nodes = await GraphNode.find({ sessionId }).lean();
    const edges = await GraphEdge.find({ sessionId }).lean();

    const nodeIds = new Set(nodes.map((n) => n.canonicalId));
    const danglingEdges = [];
    const selfLoops = [];
    const missingEvidence = [];

    for (const edge of edges) {
      if (!nodeIds.has(edge.sourceCanonicalId) || !nodeIds.has(edge.targetCanonicalId)) {
        danglingEdges.push(edge);
      }
      if (edge.sourceCanonicalId === edge.targetCanonicalId) {
        selfLoops.push(edge);
      }
      if (!edge.evidenceText && edge.verificationStatus === "inferred") {
        missingEvidence.push(edge);
      }
    }

    return {
      healthy: danglingEdges.length === 0 && selfLoops.length === 0,
      totalNodes: nodes.length,
      totalEdges: edges.length,
      danglingEdgeCount: danglingEdges.length,
      selfLoopCount: selfLoops.length,
      missingEvidenceCount: missingEvidence.length,
    };
  }
}
