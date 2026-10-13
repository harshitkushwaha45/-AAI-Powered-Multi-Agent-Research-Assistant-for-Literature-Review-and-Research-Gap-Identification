import { GraphRepository } from "../services/graphRepository.js";
import { extractScientificEntities } from "./entityExtractorAgent.js";
import { normalizeEntityName, createCanonicalId } from "../utils/entityNormalizer.js";
import { logger } from "../utils/logger.js";

/**
 * Builds the Temporal Citation Knowledge Graph (TCKG) for a research session.
 *
 * @param {string} sessionId
 * @param {Array<Object>} papers
 * @param {string} topic
 * @returns {Promise<{ nodeCount: number, edgeCount: number }>}
 */
export async function buildKnowledgeGraph(sessionId, papers, topic) {
  logger.info(`Building knowledge graph for session ${sessionId} with ${papers.length} papers...`);

  // 1. Extract scientific entities from papers
  const extractions = await extractScientificEntities(papers);
  const extractionMap = new Map(extractions.map((e) => [e.paperExternalId, e]));

  const nodes = [];
  const edges = [];
  const registeredNodes = new Set();

  function registerNode(node) {
    if (!registeredNodes.has(node.canonicalId)) {
      registeredNodes.add(node.canonicalId);
      nodes.push(node);
    }
  }

  // Register main research topic node
  const topicNode = {
    sessionId,
    nodeType: "ResearchTopic",
    canonicalId: createCanonicalId("ResearchTopic", topic),
    name: normalizeEntityName(topic),
    description: `Target research area: ${topic}`,
    firstSeenYear: 2020,
    extractionConfidence: 1.0,
    verificationStatus: "observed",
  };
  registerNode(topicNode);

  // 2. Build nodes and relationships per paper
  for (const paper of papers) {
    const paperYear = paper.year || new Date().getFullYear();
    const paperCanonicalId = `paper:${paper.externalId || paper._id}`;

    // Register Paper Node
    registerNode({
      sessionId,
      nodeType: "Paper",
      canonicalId: paperCanonicalId,
      name: paper.title,
      description: paper.abstract ? paper.abstract.slice(0, 300) : "",
      firstSeenYear: paperYear,
      sourcePaperIds: [paper._id],
      properties: {
        externalId: paper.externalId,
        source: paper.source,
        doi: paper.doi,
        url: paper.url,
        citationCount: paper.citationCount || 0,
        cluster: paper.cluster || "General",
      },
      extractionConfidence: 1.0,
      verificationStatus: "observed",
    });

    // Link Paper to Topic
    edges.push({
      edgeType: "BELONGS_TO_TOPIC",
      sourceCanonicalId: paperCanonicalId,
      targetCanonicalId: topicNode.canonicalId,
      sourceNodeType: "Paper",
      targetNodeType: "ResearchTopic",
      year: paperYear,
      confidence: 1.0,
      evidenceText: `Indexed under research topic "${topic}"`,
      sourcePaperId: paper._id,
      sourcePaperExternalId: paper.externalId,
      sourceUrl: paper.url,
      extractionMethod: "bibliographic_metadata",
      verificationStatus: "observed",
    });

    // Authors and AUTHORED_BY edges
    if (Array.isArray(paper.authors)) {
      for (const authorName of paper.authors.slice(0, 5)) {
        const normAuthor = normalizeEntityName(authorName);
        if (!normAuthor || normAuthor === "Unknown") continue;

        const authorCanonicalId = createCanonicalId("Author", normAuthor);
        registerNode({
          sessionId,
          nodeType: "Author",
          canonicalId: authorCanonicalId,
          name: normAuthor,
          firstSeenYear: paperYear,
          sourcePaperIds: [paper._id],
          extractionConfidence: 1.0,
          verificationStatus: "observed",
        });

        edges.push({
          edgeType: "AUTHORED_BY",
          sourceCanonicalId: paperCanonicalId,
          targetCanonicalId: authorCanonicalId,
          sourceNodeType: "Paper",
          targetNodeType: "Author",
          year: paperYear,
          confidence: 1.0,
          evidenceText: `Co-author listed on paper metadata: ${normAuthor}`,
          sourcePaperId: paper._id,
          sourcePaperExternalId: paper.externalId,
          sourceUrl: paper.url,
          extractionMethod: "bibliographic_metadata",
          verificationStatus: "observed",
        });
      }
    }

    // Process structured extractions for this paper
    const extraction = extractionMap.get(paper.externalId);
    if (extraction) {
      // Problems Addressed
      for (const prob of extraction.problemsAddressed || []) {
        const normProb = normalizeEntityName(prob.name);
        if (!normProb || normProb === "Unknown") continue;

        const probCanonicalId = createCanonicalId("ResearchProblem", normProb);
        registerNode({
          sessionId,
          nodeType: "ResearchProblem",
          canonicalId: probCanonicalId,
          name: normProb,
          description: prob.description || "",
          firstSeenYear: paperYear,
          sourcePaperIds: [paper._id],
          extractionConfidence: 0.9,
          verificationStatus: "inferred",
        });

        edges.push({
          edgeType: "ADDRESSES_PROBLEM",
          sourceCanonicalId: paperCanonicalId,
          targetCanonicalId: probCanonicalId,
          sourceNodeType: "Paper",
          targetNodeType: "ResearchProblem",
          year: paperYear,
          confidence: 0.88,
          evidenceText: prob.evidenceSnippet || prob.description || "",
          sourcePaperId: paper._id,
          sourcePaperExternalId: paper.externalId,
          sourceUrl: paper.url,
          extractionMethod: "gemini_structured_extraction",
          verificationStatus: "inferred",
        });
      }

      // Proposed Methods
      for (const method of extraction.proposedMethods || []) {
        const normMethod = normalizeEntityName(method.name);
        if (!normMethod || normMethod === "Unknown") continue;

        const methodCanonicalId = createCanonicalId("Method", normMethod);
        registerNode({
          sessionId,
          nodeType: "Method",
          canonicalId: methodCanonicalId,
          name: normMethod,
          description: method.description || "",
          firstSeenYear: paperYear,
          sourcePaperIds: [paper._id],
          extractionConfidence: 0.92,
          verificationStatus: "inferred",
        });

        edges.push({
          edgeType: "PROPOSES_METHOD",
          sourceCanonicalId: paperCanonicalId,
          targetCanonicalId: methodCanonicalId,
          sourceNodeType: "Paper",
          targetNodeType: "Method",
          year: paperYear,
          confidence: 0.9,
          evidenceText: method.evidenceSnippet || method.description || "",
          sourcePaperId: paper._id,
          sourcePaperExternalId: paper.externalId,
          sourceUrl: paper.url,
          extractionMethod: "gemini_structured_extraction",
          verificationStatus: "inferred",
        });
      }

      // Used Methods
      for (const method of extraction.usedMethods || []) {
        const normMethod = normalizeEntityName(method.name);
        if (!normMethod || normMethod === "Unknown") continue;

        const methodCanonicalId = createCanonicalId("Method", normMethod);
        registerNode({
          sessionId,
          nodeType: "Method",
          canonicalId: methodCanonicalId,
          name: normMethod,
          description: method.description || "",
          firstSeenYear: paperYear,
          sourcePaperIds: [paper._id],
          extractionConfidence: 0.85,
          verificationStatus: "inferred",
        });

        edges.push({
          edgeType: "USES_METHOD",
          sourceCanonicalId: paperCanonicalId,
          targetCanonicalId: methodCanonicalId,
          sourceNodeType: "Paper",
          targetNodeType: "Method",
          year: paperYear,
          confidence: 0.85,
          evidenceText: method.evidenceSnippet || method.description || "",
          sourcePaperId: paper._id,
          sourcePaperExternalId: paper.externalId,
          sourceUrl: paper.url,
          extractionMethod: "gemini_structured_extraction",
          verificationStatus: "inferred",
        });
      }

      // Datasets
      for (const ds of extraction.datasetsEvaluated || []) {
        const normDs = normalizeEntityName(ds.name);
        if (!normDs || normDs === "Unknown") continue;

        const dsCanonicalId = createCanonicalId("Dataset", normDs);
        registerNode({
          sessionId,
          nodeType: "Dataset",
          canonicalId: dsCanonicalId,
          name: normDs,
          description: ds.description || "",
          firstSeenYear: paperYear,
          sourcePaperIds: [paper._id],
          extractionConfidence: 0.88,
          verificationStatus: "inferred",
        });

        edges.push({
          edgeType: "EVALUATES_ON",
          sourceCanonicalId: paperCanonicalId,
          targetCanonicalId: dsCanonicalId,
          sourceNodeType: "Paper",
          targetNodeType: "Dataset",
          year: paperYear,
          confidence: 0.85,
          evidenceText: ds.evidenceSnippet || ds.description || "",
          sourcePaperId: paper._id,
          sourcePaperExternalId: paper.externalId,
          sourceUrl: paper.url,
          extractionMethod: "gemini_structured_extraction",
          verificationStatus: "inferred",
        });
      }

      // Research Tasks
      for (const task of extraction.researchTasks || []) {
        const normTask = normalizeEntityName(task.name);
        if (!normTask || normTask === "Unknown") continue;

        const taskCanonicalId = createCanonicalId("ResearchTask", normTask);
        registerNode({
          sessionId,
          nodeType: "ResearchTask",
          canonicalId: taskCanonicalId,
          name: normTask,
          description: task.description || "",
          firstSeenYear: paperYear,
          sourcePaperIds: [paper._id],
          extractionConfidence: 0.85,
          verificationStatus: "inferred",
        });

        edges.push({
          edgeType: "STUDIES_TASK",
          sourceCanonicalId: paperCanonicalId,
          targetCanonicalId: taskCanonicalId,
          sourceNodeType: "Paper",
          targetNodeType: "ResearchTask",
          year: paperYear,
          confidence: 0.82,
          evidenceText: task.evidenceSnippet || "",
          sourcePaperId: paper._id,
          sourcePaperExternalId: paper.externalId,
          sourceUrl: paper.url,
          extractionMethod: "gemini_structured_extraction",
          verificationStatus: "inferred",
        });
      }

      // Scientific Concepts
      for (const concept of extraction.scientificConcepts || []) {
        const normConcept = normalizeEntityName(concept.name);
        if (!normConcept || normConcept === "Unknown") continue;

        const conceptCanonicalId = createCanonicalId("ScientificConcept", normConcept);
        registerNode({
          sessionId,
          nodeType: "ScientificConcept",
          canonicalId: conceptCanonicalId,
          name: normConcept,
          firstSeenYear: paperYear,
          sourcePaperIds: [paper._id],
          extractionConfidence: 0.8,
          verificationStatus: "inferred",
        });

        edges.push({
          edgeType: "RELATED_TO_CONCEPT",
          sourceCanonicalId: paperCanonicalId,
          targetCanonicalId: conceptCanonicalId,
          sourceNodeType: "Paper",
          targetNodeType: "ScientificConcept",
          year: paperYear,
          confidence: 0.8,
          evidenceText: concept.evidenceSnippet || "",
          sourcePaperId: paper._id,
          sourcePaperExternalId: paper.externalId,
          sourceUrl: paper.url,
          extractionMethod: "gemini_structured_extraction",
          verificationStatus: "inferred",
        });
      }
    }
  }

  // 3. Persist graph via GraphRepository
  const result = await GraphRepository.bulkInsertGraph(sessionId, { nodes, edges });
  logger.info(`Knowledge graph created: ${result.nodeCount} nodes, ${result.edgeCount} edges.`);

  return result;
}
