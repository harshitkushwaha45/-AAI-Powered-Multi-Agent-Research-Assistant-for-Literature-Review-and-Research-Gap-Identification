# ResearchMind System Architecture

**Official Project Title:**  
*ResearchMind: An AI-Powered Multi-Agent Research Assistant for Literature Review and Research Gap Identification*

---

## 1. Executive Overview

ResearchMind is an evidence-grounded scientific research discovery platform that augments conventional multi-agent literature review and gap detection with:
1. **Temporal Citation Knowledge Graphs (TCKG)** representing scientific entities and chronological citation dynamics.
2. **Deep Scientific Information Extraction** with strict provenance tracking and prompt-injection defense.
3. **Graph-RAG** combining dense semantic retrieval with multi-hop graph path traversal.
4. **Temporal Link Prediction** evaluating relation-aware scientific link emergence before appearance in subsequent literature.
5. **Cross-Domain Hypothesis Discovery** proposing grounded research opportunities with counterevidence and feasibility analysis.
6. **Transparent Hypothesis Ranking** alongside the original Research Gap Confidence Score (RGCS).
7. **Historical Backtesting Engine** providing reproducible, temporal leakage-free evaluations and ablation studies against standard baselines.

---

## 2. High-Level Architectural Diagram

```
+-----------------------------------------------------------------------------------+
|                              PRESENTATION LAYER                                    |
|                      React 18 + Vite + Tailwind CSS                                |
|  - Topic Submission & Session Management     - Interactive Knowledge Graph Explorer|
|  - Multi-Agent Live Pipeline Tracker        - Cross-Domain Candidate Hypotheses   |
|  - Structured Literature Review & Tables     - Historical Backtesting Dashboard    |
|  - Exportable Scientific Reports (JSON/CSV/MD)                                     |
+------------------------------------------+----------------------------------------+
                                           | HTTP / REST (Vite Proxy / Express API)
                                           v
+-----------------------------------------------------------------------------------+
|                              APPLICATION API LAYER                                 |
|                         Node.js (v18+) + Express.js                                |
|  - Rate Limiting, Helmet Security, CORS, Centralized Error Handling                |
|  - Multi-Agent Orchestrator (6 Sequential & Cooperative Stages)                   |
|  - Input Validation & Untrusted Text Sanitization (Prompt-Injection Defense)       |
+------------------------------------------+----------------------------------------+
         |                                 |                                 |
         v                                 v                                 v
+------------------+             +--------------------+            +----------------+
|  ACADEMIC APIS   |             |  EMBEDDING & LLM   |            | ML SERVICE     |
| - arXiv Atom API |             | - MiniLM-L6-v2     |            | - PyTorch CPU  |
| - Semantic       |             |   (In-Process 384d)|            | - R-GCN Model  |
|   Scholar Graph  |             | - Google Gemini    |            | - Baselines    |
|   API            |             |   (Structured JSON)|            | - Backtesting  |
+------------------+             +--------------------+            +----------------+
         |                                 |                                 |
         +---------------------------------+---------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                              DATA PERSISTENCE LAYER                                |
|                                                                                   |
|  +-------------------------------------+   +------------------------------------+ |
|  |           MongoDB / Atlas           |   |            Neo4j / Graph           | |
|  | - ResearchSessions & Steps          |   | - Nodes: Paper, Author, Method,    | |
|  | - Papers (Metadata & Embeddings)    |   |   Dataset, Problem, Topic, Concept | |
|  | - Extracted Entities & Hypotheses   |   | - Relationships: CITES, USES,      | |
|  | - Evaluation Runs & Metrics         |   |   PROPOSES, EVALUATES_ON, ADDRESSES| |
|  | - Graph Collections (Fallback store)|   | - Temporal Subgraphs & Cypher Paths| |
|  +-------------------------------------+   +------------------------------------+ |
+-----------------------------------------------------------------------------------+
```

---

## 3. Core Subsystems

### A. Academic Literature Retrieval & Provenance Tracking
- **arXiv Integration**: Queries the arXiv Atom API, parses XML, and extracts authoritative paper metadata.
- **Semantic Scholar Integration**: Extracts citation counts, authors, venues, DOIs, and external IDs.
- **Deduplication**: Multi-key entity matching based on normalized titles, DOIs, and arXiv IDs.

### B. Deep Scientific Information Extraction
- Extracts 8 entity types and 10 relationship types from abstracts and accessible texts.
- Distinguishes observed bibliographic facts (e.g., `CITES`, `AUTHORED_BY`) from model-inferred claims (e.g., `PROPOSES_METHOD`, `ADDRESSES_PROBLEM`).
- Validates provenance: every node and relationship stores source paper ID, publication year, evidence text snippet, extraction method, and extraction confidence.

### C. Temporal Citation Knowledge Graph (TCKG)
- Unified Graph Repository interface supporting both **Neo4j** (via native `neo4j-driver`) and **MongoDB/In-Memory fallback store**.
- Strict temporal isolation: queries support cutoff year filtering (`year <= cutoffYear`) to prevent future graph knowledge leakage.

### D. Graph-RAG Retrieval
- Combines 384-dimensional dense text embeddings (`all-MiniLM-L6-v2`) with multi-hop topological graph walks.
- Identifies cross-domain paths connecting methods in one domain with problems in another domain.
- Returns verbatim supporting quotes, paper identifiers, and notes any identified counterevidence.

### E. Temporal Link Prediction & GNN Learning
- **Baseline 1**: Semantic Similarity (Embedding cosine similarity between methods and problems).
- **Baseline 2**: Static Graph Topology (Common Neighbors, Adamic-Adar, Jaccard Index).
- **Baseline 3**: Temporal Baseline (Growth velocity, recency-weighted co-occurrence).
- **Proposed Method**: Relation-aware temporal prediction (Relational GCN encoder with score decoder).
- Prevents data leakage through strict pre-cutoff historical training splits.

### F. Cross-Domain Hypothesis Discovery & Ranking
- Generates structured research hypotheses linking methods to unaddressed problems.
- Computes multi-factor composite ranking:
  - Link Prediction Score
  - Evidence Quality & Coverage
  - Novelty Proxy
  - Feasibility / Counterevidence Penalty
- Retains original **Research Gap Confidence Score (RGCS)** side-by-side for comparison.

### G. Historical Backtesting
- Evaluates predictions made with information up to historical cutoff (e.g. 2021) against true future scientific connections observed in evaluation window (2022–2024).
- Reports real metrics: Precision@K, Recall@K, MRR, Hits@1/3/5/10, along with systematic ablation studies.
