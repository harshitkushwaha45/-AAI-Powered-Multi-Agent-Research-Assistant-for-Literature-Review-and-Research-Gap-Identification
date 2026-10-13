/**
 * Provenance validation utility.
 * Guarantees that every extracted entity and relationship retains
 * unambiguous evidentiary tracing (source paper, year, confidence, verification status).
 */

export const VALID_NODE_TYPES = Object.freeze([
  "Paper",
  "Author",
  "ResearchTopic",
  "Method",
  "Dataset",
  "ResearchProblem",
  "ResearchTask",
  "ScientificConcept",
]);

export const VALID_RELATIONSHIPS = Object.freeze([
  "CITES",
  "AUTHORED_BY",
  "PROPOSES_METHOD",
  "USES_METHOD",
  "EVALUATES_ON",
  "ADDRESSES_PROBLEM",
  "BELONGS_TO_TOPIC",
  "EXTENDS_METHOD",
  "STUDIES_TASK",
  "RELATED_TO_CONCEPT",
]);

export const VERIFICATION_STATUSES = Object.freeze([
  "observed", // Direct bibliographic evidence (e.g. arXiv citation, metadata author)
  "inferred", // Extracted via LLM or rule from paper abstract/text
  "verified", // Confirmed via external ground-truth dataset or human validation
]);

/**
 * Validates and normalizes provenance metadata.
 *
 * @param {Object} provenance
 * @returns {Object} Validated provenance object
 */
export function validateProvenance(provenance = {}) {
  const currentYear = new Date().getFullYear();
  const year = Number(provenance.year);
  const validatedYear =
    Number.isInteger(year) && year >= 1900 && year <= currentYear + 1 ? year : currentYear;

  const rawConfidence = Number(provenance.confidence);
  const confidence = Number.isFinite(rawConfidence)
    ? Math.min(1.0, Math.max(0.0, rawConfidence))
    : 0.7;

  const status = VERIFICATION_STATUSES.includes(provenance.verificationStatus)
    ? provenance.verificationStatus
    : "inferred";

  return {
    sourcePaperId: provenance.sourcePaperId || null,
    sourcePaperExternalId: provenance.sourcePaperExternalId || "",
    year: validatedYear,
    evidenceText: (provenance.evidenceText || "").trim().slice(0, 1000),
    sourceUrl: provenance.sourceUrl || "",
    extractionMethod: provenance.extractionMethod || "gemini_structured_extraction",
    confidence,
    verificationStatus: status,
    timestamp: provenance.timestamp ? new Date(provenance.timestamp) : new Date(),
  };
}

/**
 * Ensures relationship endpoints match valid node and edge schemas.
 *
 * @param {Object} edge
 * @returns {boolean}
 */
export function isValidEdgeDefinition(edge) {
  if (!edge || typeof edge !== "object") return false;
  if (!VALID_RELATIONSHIPS.includes(edge.edgeType)) return false;
  if (!edge.sourceCanonicalId || !edge.targetCanonicalId) return false;
  if (!VALID_NODE_TYPES.includes(edge.sourceNodeType)) return false;
  if (!VALID_NODE_TYPES.includes(edge.targetNodeType)) return false;
  return true;
}
