# Temporal Citation Knowledge Graph (TCKG) Schema

**Official Project Title:**  
*ResearchMind: An AI-Powered Multi-Agent Research Assistant for Literature Review and Research Gap Identification*

---

## 1. Node Types & Attributes

| Node Label | Canonical Prefix | Description | Primary Attributes |
|---|---|---|---|
| `Paper` | `paper:` | Academic paper (arXiv / Semantic Scholar) | `canonicalId`, `title`, `year`, `citationCount`, `doi`, `url`, `source` |
| `Author` | `author:` | Paper author | `canonicalId`, `name` |
| `ResearchTopic` | `topic:` | Field or subdiscipline | `canonicalId`, `name`, `description` |
| `Method` | `method:` | Proposed or utilized algorithm, architecture, or technique | `canonicalId`, `name`, `description`, `firstSeenYear` |
| `Dataset` | `dataset:` | Benchmark or dataset evaluated upon | `canonicalId`, `name`, `description` |
| `ResearchProblem`| `problem:` | Unsolved scientific challenge, task limitation, or bottleneck | `canonicalId`, `name`, `description`, `firstSeenYear` |
| `ResearchTask` | `task:` | Operational academic task (e.g., Question Answering, Fact Verification) | `canonicalId`, `name`, `description` |
| `ScientificConcept`| `concept:` | Theoretical framework, conceptual primitive, or domain mechanism | `canonicalId`, `name`, `description` |

---

## 2. Relationship Types & Provenance Semantics

| Relationship | Source Node | Target Node | Verification Status | Evidentiary Description |
|---|---|---|---|---|
| `CITES` | `Paper` | `Paper` | `observed` | Bibliographic citation extracted from academic metadata. |
| `AUTHORED_BY` | `Paper` | `Author` | `observed` | Author list extracted from authoritative paper metadata. |
| `PROPOSES_METHOD` | `Paper` | `Method` | `inferred` / `verified` | Paper explicitly introduces a novel algorithm or architectural extension. |
| `USES_METHOD` | `Paper` | `Method` | `inferred` | Paper utilizes an established method as a component or baseline. |
| `EVALUATES_ON` | `Paper` | `Dataset` | `inferred` | Paper reports empirical results on a benchmark dataset. |
| `ADDRESSES_PROBLEM`| `Paper` | `ResearchProblem`| `inferred` | Paper formulates or addresses a specific scientific bottleneck. |
| `BELONGS_TO_TOPIC` | `Paper` | `ResearchTopic` | `inferred` | Cluster or category assignment based on conceptual similarity. |
| `EXTENDS_METHOD` | `Method` | `Method` | `inferred` | Method is documented as an evolution or architectural adaptation of another. |
| `STUDIES_TASK` | `Paper` | `ResearchTask` | `inferred` | Operational task tackled in experimental setting. |
| `RELATED_TO_CONCEPT`| `Method`/`Problem` | `ScientificConcept` | `inferred` | Connects entity to broader theoretical domain mechanism. |

---

## 3. Provenance & Temporal Schema

Every node and edge stores the following provenance attributes:

```json
{
  "sourcePaperId": "651a9f3b8c2d1e0012345678",
  "sourcePaperExternalId": "2310.12345",
  "year": 2023,
  "confidence": 0.88,
  "evidenceText": "We propose Graph-RAG to alleviate hallucination in large language models by traversing multi-hop knowledge subgraphs.",
  "sourceUrl": "https://arxiv.org/abs/2310.12345",
  "extractionMethod": "gemini_structured_extraction",
  "verificationStatus": "inferred",
  "timestamp": "2026-10-13T00:00:00.000Z"
}
```

---

## 4. Idempotency & Deduplication Guarantees

1. **Entity Canonicalization**: Entities undergo token standardization, case normalization, and synonym resolution (e.g. `RAG` $\rightarrow$ `Retrieval-Augmented Generation`).
2. **Deterministic Keys**: Unique composite indexes `(sessionId, canonicalId)` on `GraphNode` and `(sessionId, edgeType, sourceCanonicalId, targetCanonicalId)` on `GraphEdge`.
3. **Neo4j Cypher Integration**: All graph synchronizations utilize `MERGE` statements with `ON CREATE` and `ON MATCH` clauses to prevent duplicate nodes or edges upon re-running sessions.
