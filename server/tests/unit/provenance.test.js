import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateProvenance,
  isValidEdgeDefinition,
  VALID_NODE_TYPES,
  VALID_RELATIONSHIPS,
} from "../../src/utils/provenanceValidator.js";

describe("Provenance Validator Unit Tests", () => {
  it("validates and bounds confidence scores within [0.0, 1.0]", () => {
    const p1 = validateProvenance({ confidence: 1.5 });
    assert.equal(p1.confidence, 1.0);

    const p2 = validateProvenance({ confidence: -0.4 });
    assert.equal(p2.confidence, 0.0);

    const p3 = validateProvenance({ confidence: "invalid" });
    assert.equal(p3.confidence, 0.7); // safe default
  });

  it("validates publication years and caps unrealistic dates", () => {
    const currentYear = new Date().getFullYear();
    const p = validateProvenance({ year: 1850 });
    assert.equal(p.year, currentYear);

    const validP = validateProvenance({ year: 2021 });
    assert.equal(validP.year, 2021);
  });

  it("enforces valid edge relationships and node types", () => {
    const validEdge = {
      edgeType: "PROPOSES_METHOD",
      sourceCanonicalId: "paper:123",
      targetCanonicalId: "method:rag",
      sourceNodeType: "Paper",
      targetNodeType: "Method",
    };
    assert.equal(isValidEdgeDefinition(validEdge), true);

    const invalidType = {
      edgeType: "UNKNOWN_RELATION",
      sourceCanonicalId: "paper:123",
      targetCanonicalId: "method:rag",
      sourceNodeType: "Paper",
      targetNodeType: "Method",
    };
    assert.equal(isValidEdgeDefinition(invalidType), false);

    const invalidEndpoint = {
      edgeType: "PROPOSES_METHOD",
      sourceCanonicalId: "",
      targetCanonicalId: "method:rag",
      sourceNodeType: "Paper",
      targetNodeType: "Method",
    };
    assert.equal(isValidEdgeDefinition(invalidEndpoint), false);
  });

  it("contains all 8 required scientific node types and 10 relationship types", () => {
    assert.equal(VALID_NODE_TYPES.length, 8);
    assert.ok(VALID_NODE_TYPES.includes("Paper"));
    assert.ok(VALID_NODE_TYPES.includes("Method"));
    assert.ok(VALID_NODE_TYPES.includes("ResearchProblem"));
    assert.ok(VALID_NODE_TYPES.includes("Dataset"));
    assert.ok(VALID_NODE_TYPES.includes("Author"));
    assert.ok(VALID_NODE_TYPES.includes("ResearchTask"));
    assert.ok(VALID_NODE_TYPES.includes("ResearchTopic"));
    assert.ok(VALID_NODE_TYPES.includes("ScientificConcept"));

    assert.equal(VALID_RELATIONSHIPS.length, 10);
    assert.ok(VALID_RELATIONSHIPS.includes("CITES"));
    assert.ok(VALID_RELATIONSHIPS.includes("AUTHORED_BY"));
    assert.ok(VALID_RELATIONSHIPS.includes("PROPOSES_METHOD"));
    assert.ok(VALID_RELATIONSHIPS.includes("USES_METHOD"));
    assert.ok(VALID_RELATIONSHIPS.includes("EVALUATES_ON"));
    assert.ok(VALID_RELATIONSHIPS.includes("ADDRESSES_PROBLEM"));
    assert.ok(VALID_RELATIONSHIPS.includes("BELONGS_TO_TOPIC"));
    assert.ok(VALID_RELATIONSHIPS.includes("EXTENDS_METHOD"));
    assert.ok(VALID_RELATIONSHIPS.includes("STUDIES_TASK"));
    assert.ok(VALID_RELATIONSHIPS.includes("RELATED_TO_CONCEPT"));
  });
});
