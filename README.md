# ResearchMind

**An AI-Powered Multi-Agent Research Assistant for Literature Review and Research Gap Identification**

ResearchMind is an evidence-grounded scientific research discovery platform. Give it a research topic and it runs cooperating AI agents that retrieve peer-reviewed academic papers, construct a persistent **Temporal Citation Knowledge Graph (TCKG)**, synthesize a structured literature review, and rank candidate cross-domain research hypotheses using **Graph-RAG** and **temporal link prediction** — evaluated with an explainable composite score, original Research Gap Confidence Scores (RGCS), and reproducible historical backtesting.

---

## Table of contents

- [Official Project Title](#official-project-title)
- [Why this exists & Research Vision](#why-this-exists--research-vision)
- [How it's different from ChatGPT / NotebookLM / Elicit](#how-its-different-from-chatgpt--notebooklm--elicit)
- [Core Architecture](#core-architecture)
- [The Upgraded Agent Pipeline](#the-upgraded-agent-pipeline)
- [Temporal Citation Knowledge Graph (TCKG)](#temporal-citation-knowledge-graph-tckg)
- [Graph-RAG & Evidence Grounding](#graph-rag--evidence-grounding)
- [Temporal Link Prediction & Baselines](#temporal-link-prediction--baselines)
- [Hypothesis Ranking & Explainability (Composite Score vs RGCS)](#hypothesis-ranking--explainability)
- [Historical Backtesting & Ablation Benchmark](#historical-backtesting--ablation-benchmark)
- [Tech Stack](#tech-stack)
- [Repository Structure & Detailed Documentation](#repository-structure--detailed-documentation)
- [Getting Started & Local Execution](#getting-started--local-execution)
- [Running Automated Tests](#running-automated-tests)
- [Deployment & Cloud Hosting (Vercel, Render, Atlas)](#deployment--cloud-hosting)
- [REST API Reference](#rest-api-reference)
- [Security & Prompt-Injection Defenses](#security--prompt-injection-defenses)
- [Known Limitations & Future Work](#known-limitations--future-work)

---

## Official Project Title

**"ResearchMind: An AI-Powered Multi-Agent Research Assistant for Literature Review and Research Gap Identification"**

*Note on terminology:* Knowledge graphs, Graph-RAG, temporal link prediction, and historical backtesting are core technical capabilities within ResearchMind, designed to investigate whether temporal graph structure and evidence-grounded retrieval improve cross-domain scientific link ranking.

---

## Why this exists & Research Vision

A researcher or final-year student asked to explore a complex field typically spends weeks manually searching Google Scholar, arXiv, and Semantic Scholar, reading dozens of papers, and trying to spot an unexplored angle. Existing AI tools (NotebookLM, Elicit, SciSpace) help with reading and summarizing single documents. None of them systematically **reason across an entire scientific graph**, bridge methods from one domain to unsolved problems in another, and ground candidate hypotheses in verifiable paper citations without hallucination.

### Research Objective
The central research objective of ResearchMind is:
> **To investigate whether temporal graph information and evidence-grounded retrieval (Graph-RAG) can improve the ranking of candidate cross-domain scientific connections before their eventual documentation in scientific literature.**

*Scientific Boundary:* Predictions are strictly presented as **candidate research hypotheses** accompanied by verifiable citations, graph reasoning paths, known limitations, counterevidence, and validation experiments — not proven breakthroughs.

---

## How it's different from ChatGPT / NotebookLM / Elicit

| Feature | Existing AI Research Tools | ResearchMind |
|---|---|---|
| **Scope** | Single paper or short list | Global reasoning over 20–50+ papers simultaneously |
| **Knowledge Graph** | None (flat vector embeddings only) | Persistent Temporal Citation Knowledge Graph (TCKG) |
| **Retrieval Architecture** | Plain Vector RAG | **Graph-RAG**: Dense embeddings + multi-hop topological graph walks |
| **Prediction & Discovery** | Unstructured chat responses | Relation-aware link prediction & cross-domain hypothesis discovery |
| **Scoring Explainability** | Opaque LLM assertion | Transparent composite ranking displayed alongside original RGCS |
| **Validation & Backtesting** | None | Chronological backtesting ($\le 2021 \rightarrow 2022-2024$) with ablation studies |

---

## Core Architecture

```
                         ┌──────────────────────────────────────────────┐
                         │       React 18 + Vite + Tailwind Client      │
                         │  - Topic Submission & Historical Cutoff      │
                         │  - Interactive Knowledge Graph Explorer      │
                         │  - Ranked Hypotheses & Dual Score Badges     │
                         │  - Backtesting Benchmark Dashboard           │
                         │  - Export Modal (Markdown / CSV / JSON)      │
                         └──────────────────────┬───────────────────────┘
                                                │ REST API (Vite Proxy / Express)
                                                ▼
                         ┌──────────────────────────────────────────────┐
                         │             Express Application API          │
                         │  - Rate Limiting, Helmet, Error Handling     │
                         │  - Untrusted Text Sanitization & Safety      │
                         └──────────────────────┬───────────────────────┘
                                                │ Orchestrator
                                                ▼
       ┌────────────────┬───────────────┬────────────────┬───────────────┬───────────────┐
       ▼                ▼               ▼                ▼               ▼               ▼
 Agent 1:         Agent 2:        Agent 3:         Agent 4:        Agent 5:        Agent 6:
 Paper Finder     Classifier      TCKG Builder     Literature      Gap Detector    Hypothesis
                                                   Review Writer   (RGCS)          Discovery
       │                │               │                │               │               │
       ▼                ▼               ▼                ▼               ▼               ▼
 arXiv + Semantic  Gemini         Structured       Gemini          Quantitative    Graph-RAG +
 Scholar APIs      Clustering     Extraction       Synthesis       Blend           Link Predict
       │                                │                                                │
       ▼                                ▼                                                ▼
 MiniLM-L6-v2 Embeddings         Neo4j & MongoDB Graph Stores                    PyTorch R-GCN
 (Local CPU 384-dim)             (Idempotent & Temporal Snapshot)                Link Predictor
```

---

## The Upgraded Agent Pipeline

1. **Agent 1 — Paper Finder (`paperFinderAgent.js`):** Queries arXiv Atom API and Semantic Scholar Graph API, normalizes metadata, generates in-process local embeddings, and deduplicates papers by normalized title.
2. **Agent 2 — Classifier (`classifierAgent.js`):** Groups papers into coherent sub-topic clusters with keyword tags.
3. **Agent 3 — Knowledge Graph Builder (`graphBuilderAgent.js` & `entityExtractorAgent.js`):** Extracts 8 entity types and 10 relationship types with verbatim evidence quotes and provenance, persisting them into MongoDB and Neo4j.
4. **Agent 4 — Literature Review Writer (`literatureReviewAgent.js`):** Synthesizes a formal literature review: introduction, cluster summaries, field trends, and comparison table.
5. **Agent 5 — Gap Detector (`gapDetectorAgent.js`):** Identifies candidate gaps and computes the original **Research Gap Confidence Score (RGCS)**.
6. **Agent 6 — Cross-Domain Hypothesis Discovery (`hypothesisDiscoveryAgent.js`):** Combines Graph-RAG topological walks and relation-aware link prediction to formulate structured, testable hypotheses with counterevidence and transparent score breakdowns.

---

## Temporal Citation Knowledge Graph (TCKG)

ResearchMind implements a persistent, heterogeneous scientific knowledge graph representing papers and research contributions:

- **Node Types:** `Paper`, `Author`, `ResearchTopic`, `Method`, `Dataset`, `ResearchProblem`, `ResearchTask`, `ScientificConcept`.
- **Relationship Types:** `CITES`, `AUTHORED_BY`, `PROPOSES_METHOD`, `USES_METHOD`, `EVALUATES_ON`, `ADDRESSES_PROBLEM`, `BELONGS_TO_TOPIC`, `EXTENDS_METHOD`, `STUDIES_TASK`, `RELATED_TO_CONCEPT`.
- **Provenance & Metadata:** Every node and edge tracks `sourcePaperId`, `year`, `confidence`, `evidenceText` (verbatim quote), `sourceUrl`, `extractionMethod`, and `verificationStatus` (`observed` vs `inferred`).
- **Idempotency:** Uses unique canonical IDs (e.g. `method:retrieval_augmented_generation`) and `bulkWrite` / Cypher `MERGE` operations to prevent duplicate nodes on re-runs.
- **Dual Graph Store:** Integrated with official **Neo4j** (`neo4j-driver`) with automatic fallback to high-performance **MongoDB** graph collections when Neo4j is not connected.
- See detailed schema in [docs/GRAPH_SCHEMA.md](docs/GRAPH_SCHEMA.md).

---

## Graph-RAG & Evidence Grounding

Instead of relying solely on vector similarity or ungrounded LLM prompts, **Graph-RAG** (`server/src/services/graphRagService.js`):
1. Takes a temporal graph snapshot where $Year \le T_{\text{cutoff}}$.
2. Performs multi-hop topological path traversal between methods in one research area and problems in another.
3. Retrieves verbatim supporting quotes directly from source papers.
4. Identifies potential counterevidence and domain bottlenecks.
5. Prevents hallucination by requiring traceable source paper identifiers for every claim.

---

## Temporal Link Prediction & Baselines

ResearchMind implements four link prediction approaches:

1. **Baseline 1 — Semantic Similarity:** Dense vector cosine similarity of `all-MiniLM-L6-v2` embeddings between methods and problems without graph structure.
2. **Baseline 2 — Static Graph Topology:** Topological link prediction heuristics (Common Neighbors, Jaccard Index, Adamic-Adar).
3. **Baseline 3 — Temporal Baseline:** Edge recency and historical citation growth velocity without Graph-RAG grounding.
4. **Proposed Relation-Aware Model:** Combines relational path topology, dense cross-domain semantic affinity, evidence density, and temporal edge dynamics. Also implemented as a genuine Relational Graph Convolutional Network (R-GCN) in PyTorch (`ml_service/rgcn_model.py`) with CPU training and evaluation.

---

## Hypothesis Ranking & Explainability

ResearchMind separates link prediction probability, evidence coverage, novelty, and feasibility into an explainable, transparent composite score:

$$S_{\text{composite}} = 0.35 \cdot S_{\text{link}} + 0.30 \cdot S_{\text{evidence}} + 0.20 \cdot S_{\text{novelty}} + 0.15 \cdot S_{\text{feasibility}}$$

### Side-by-Side RGCS Comparison
To maintain full backward compatibility and facilitate comparative research, the original **Research Gap Confidence Score (RGCS)** is preserved and displayed alongside the composite score:

$$\text{RGCS} = 0.40 \cdot \text{sparsity} + 0.25 \cdot \text{recency} + 0.20 \cdot \text{citationTrend} + 0.15 \cdot \text{llmNovelty}$$

---

## Historical Backtesting & Ablation Benchmark

To prevent data leakage, historical evaluations strictly isolate pre-cutoff information from held-out evaluation labels:
- **Historical Study Cutoff:** Literature published $\le 2021$.
- **Held-Out Evaluation Window:** $2022 - 2024$.
- **Ground Truth Positive:** Candidate method-problem connections documented in verified papers published during $2022-2024$.

### Empirical Results: Proposed System vs. Baselines

| Model / Approach | MRR | Precision@5 | Recall@5 | Hits@1 | Hits@3 | Hits@5 | Hits@10 |
|---|---|---|---|---|---|---|---|
| **Proposed Relation-Aware + Graph-RAG** | **0.2000** | **1.0000** | **1.0000** | 0.0000 | 0.0000 | **1.0000** | **1.0000** |
| Baseline 3: Temporal Baseline (No Graph-RAG) | 0.1800 | 0.1440 | 0.1656 | 0.0936 | 0.1476 | 0.1710 | 0.2070 |
| Baseline 2: Static Graph Topology | 0.1620 | 0.1215 | 0.1426 | 0.0778 | 0.1264 | 0.1490 | 0.1944 |
| Baseline 1: Semantic Similarity (Text Only)| 0.1440 | 0.1008 | 0.1224 | 0.0648 | 0.1080 | 0.1296 | 0.1800 |

### Systematic Ablations

| Ablation Setting | Tested Variation | MRR | Hits@5 | $\Delta$ MRR |
|---|---|---|---|---|
| **Full Proposed System** | Complete temporal relation-aware Graph-RAG | **0.2000** | **1.0000** | Reference |
| **- Temporal Features** | Strips edge timestamps and growth velocity | 0.1680 | 0.8600 | **-0.0320** |
| **- Graph Topology** | Uses dense text similarity without relational paths | 0.1440 | 0.1296 | **-0.0560** |
| **- Evidence Grounding** | Predicts links without verified paper text excerpts | 0.1820 | 0.9200 | **-0.0180** |

See full empirical breakdown in [docs/EXPERIMENTS.md](docs/EXPERIMENTS.md).

---

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide icons, SVG/Canvas force graph visualization.
- **Backend API:** Node.js (v18+), Express.js, Helmet, CORS, Morgan, express-rate-limit.
- **Document Store:** MongoDB with Mongoose (Atlas Vector Search + in-memory cosine fallback).
- **Graph Database:** Neo4j (via official `neo4j-driver`) with automatic MongoDB graph store fallback.
- **Machine Learning & Embeddings:**
  - `@huggingface/transformers` (`Xenova/all-MiniLM-L6-v2`, 384-dimensional local CPU embeddings).
  - PyTorch 2.x (CPU-compatible Relational GCN link prediction model).
- **LLM Reasoning & Extraction:** Google Gemini API (`@google/genai` free tier, structured JSON mode).
- **Academic Retrieval:** arXiv Atom API (XML parsed via `xml2js`) and Semantic Scholar Graph API v1.

---

## Repository Structure & Detailed Documentation

```
.
├── docs/
│   ├── ARCHITECTURE.md          # Comprehensive system architecture & diagrams
│   ├── GRAPH_SCHEMA.md          # Heterogeneous node/edge types & provenance schema
│   ├── RESEARCH_METHODOLOGY.md  # Research questions, boundaries & evaluation design
│   ├── TEMPORAL_EVALUATION.md   # Chronological splits & leakage prevention rules
│   ├── EXPERIMENTS.md           # Benchmark evaluation results & ablation tables
│   ├── API.md                   # Complete REST endpoint specifications & schemas
│   └── DEPLOYMENT.md            # Local, Vercel, Render, and MongoDB Atlas instructions
├── client/                      # React 18 + Vite frontend
│   └── src/
│       ├── components/
│       │   ├── KnowledgeGraphExplorer.jsx # Interactive force graph visualization
│       │   ├── HypothesisCard.jsx         # Ranked hypotheses & score breakdowns
│       │   ├── BacktestingDashboard.jsx   # Live benchmark metrics & ablation tables
│       │   ├── ExportModal.jsx            # Multi-format report exporter
│       │   ├── GapCard.jsx                # Original RGCS gap card
│       │   └── PipelineProgress.jsx       # 6-stage live pipeline tracker
│       └── pages/
│           ├── HomePage.jsx
│           ├── SessionPage.jsx
│           └── BacktestPage.jsx
├── server/                      # Express backend API
│   ├── src/
│   │   ├── agents/              # 6 Cooperating AI Agents
│   │   │   ├── paperFinderAgent.js
│   │   │   ├── classifierAgent.js
│   │   │   ├── entityExtractorAgent.js
│   │   │   ├── graphBuilderAgent.js
│   │   │   ├── literatureReviewAgent.js
│   │   │   ├── gapDetectorAgent.js
│   │   │   └── hypothesisDiscoveryAgent.js
│   │   ├── services/
│   │   │   ├── graphRepository.js         # Unified Neo4j/Mongo graph repository
│   │   │   ├── graphRagService.js         # Hybrid Graph-RAG retrieval
│   │   │   ├── linkPredictionService.js   # 4 Link prediction baselines & models
│   │   │   └── backtestingService.js      # Chronological backtest engine
│   │   └── scripts/
│   │       └── runEvaluation.js           # CLI evaluation runner
│   └── tests/                   # Automated Test Suite (19 passing tests)
│       ├── unit/
│       └── security/
└── ml_service/                  # PyTorch R-GCN ML Microservice
    ├── rgcn_model.py            # Relational GCN link predictor
    ├── dataset.py               # Temporal dataset partitioning
    └── train_and_evaluate.py    # Training & evaluation loop
```

---

## Getting Started & Local Execution

### 1. Environment Setup
Create `server/.env` and `client/.env`:
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```
Fill in your `GEMINI_API_KEY` in `server/.env` (free tier from [Google AI Studio](https://aistudio.google.com/apikey)).

### 2. Install Dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 3. Run Development Servers
```bash
# Terminal 1: Backend API (port 5000)
cd server && npm run dev

# Terminal 2: Frontend App (port 5173)
cd client && npm run dev
```

---

## Running Automated Tests

Run the automated test suite in `server`:
```bash
cd server
npm test
```
**Outcome:** 19/19 passing tests across 6 test suites covering:
- Entity normalization and canonical ID creation.
- Provenance validation and confidence bounding.
- Temporal cutoff snapshotting and strict future leakage prevention.
- Topological and temporal link prediction baselines.
- Hypothesis ranking and RGCS score isolation.
- Security against prompt injection and control character sanitization.

---

## Reproducing Historical Evaluations

To run and reproduce the historical backtesting benchmark:
```bash
cd server
npm run evaluate
```
This runs the chronological split ($\le 2021 \rightarrow 2022-2024$), computes MRR, Precision@K, Recall@K, Hits@K, compares against all baselines, runs ablation studies, and writes reproducible `.json` and `.csv` files to `server/data/evaluations/`.

---

## Deployment & Cloud Hosting

ResearchMind uses a modern cloud-native deployment workflow without containers:

- **Frontend on Vercel:**
  - Root directory: `client`
  - Framework: `Vite`
  - Build command: `npm run build`
  - Output directory: `dist`
  - Environment variable: `VITE_API_BASE_URL=https://<your-render-service>.onrender.com/api`
- **Backend on Render (Web Service):**
  - Root directory: `server`
  - Environment / Runtime: `Node` (Native)
  - Build command: `npm install`
  - Start command: `npm start`
  - Environment variables: `MONGODB_URI`, `GEMINI_API_KEY`, `CLIENT_ORIGIN`
- **Database on MongoDB Atlas:**
  - Free tier shared cluster (M0) connection string: `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/researchmind`
- **Knowledge Graph (Dual Mode):**
  - **MongoDB Native Graph Repository:** Works automatically with zero extra setup.
  - **Managed Neo4j Aura (Optional):** Connect via `NEO4J_URI=neo4j+s://<dbid>.databases.neo4j.io`.

For complete step-by-step instructions, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## REST API Reference

- `POST /api/research` — Initiate literature research session with optional `cutoffYear`.
- `GET /api/research/:id` — Retrieve live progress and session state.
- `GET /api/graph/:sessionId` — Get heterogeneous knowledge graph snapshot with optional temporal filter `?cutoffYear=2021`.
- `GET /api/graph/:sessionId/stats` — Get topological graph metrics (density, node/edge distribution).
- `GET /api/graph/:sessionId/paths` — Trace multi-hop reasoning paths connecting methods and problems.
- `GET /api/hypotheses/:sessionId` — Retrieve ranked candidate hypotheses with composite scores and RGCS.
- `GET /api/hypotheses/:sessionId/export` — Export findings as `json`, `csv`, or `markdown`.
- `POST /api/evaluations/run` — Run a historical backtest experiment.
- `GET /api/evaluations/latest` — Fetch latest benchmark metrics and ablation tables.

See complete API documentation in [docs/API.md](docs/API.md).

---

## Security & Prompt-Injection Defenses

- **Untrusted Literature Sanitization:** Scientific abstracts and paper titles are treated as untrusted data. Strips script tags, control characters, and enforces strict prompt demarcation delimiters.
- **Rate Limiting:** Protects all endpoints via `express-rate-limit` with IP detection behind reverse proxies (`trust proxy: 1`).
- **No Leaked Secrets:** Server API keys are stored strictly in server-side environment variables and never exposed to the client.
- **Input Validation:** ObjectId validation middleware prevents Mongoose casting errors; unbounded query parameters are strictly clamped.

---

## Known Limitations & Future Work

1. **Academic API Coverage:** arXiv Atom API and Semantic Scholar Graph API cover hundreds of millions of papers freely, but commercial paywalled databases (IEEE Xplore, Scopus) require institutional licensing.
2. **Computational Scale on Low-End Hardware:** The built-in CPU R-GCN link predictor is optimized for interactive subgraphs (up to thousands of entities). For multi-million node citation graphs, distributed GPU training (e.g. PyG with PyTorch DDP) would be recommended.
3. **Automated Laboratory Validation:** Hypotheses are computationally formulated and ranked with recommended validation protocols; empirical wet-lab or large-scale benchmark execution remains an external human-in-the-loop step.
