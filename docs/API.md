# ResearchMind REST API Documentation

**Official Project Title:**  
*ResearchMind: An AI-Powered Multi-Agent Research Assistant for Literature Review and Research Gap Identification*

---

## Base URL
- Local Development: `http://localhost:5000/api`
- Production (Render): `https://<your-service>.onrender.com/api`

---

## 1. Research Sessions (`/api/research`)

### `POST /api/research`
Initiates a multi-agent research pipeline for a topic.
- **Request Body:**
  ```json
  {
    "topic": "Retrieval-augmented generation for scientific literature",
    "cutoffYear": 2021 // Optional: temporal cutoff for historical backtesting
  }
  ```
- **Response (`201 Created`):**
  ```json
  {
    "sessionId": "651a9f3b8c2d1e0012345678"
  }
  ```

### `GET /api/research/:id`
Retrieves live pipeline progress and session state.
- **Response (`200 OK`):**
  ```json
  {
    "_id": "651a9f3b8c2d1e0012345678",
    "topic": "Retrieval-augmented generation for scientific literature",
    "status": "completed",
    "steps": [
      { "step": "paper_finder", "status": "completed", "message": "Found 35 papers" },
      { "step": "classifier", "status": "completed", "message": "5 clusters identified" },
      { "step": "graph_builder", "status": "completed", "message": "Constructed graph: 42 nodes, 86 edges" },
      { "step": "literature_review", "status": "completed" },
      { "step": "gap_detector", "status": "completed", "message": "4 candidate gaps found" },
      { "step": "hypothesis_discovery", "status": "completed", "message": "Discovered 4 grounded cross-domain hypotheses" }
    ],
    "paperCount": 35,
    "graphStats": { "nodeCount": 42, "edgeCount": 86, "density": 0.098 },
    "hypothesisCount": 4
  }
  ```

### `DELETE /api/research/:id`
Cascades deletion of session, papers, graph entities, and hypotheses.

---

## 2. Knowledge Graph (`/api/graph`)

### `GET /api/graph/:sessionId`
Retrieves the heterogeneous subgraph snapshot.
- **Query Parameters:**
  - `cutoffYear` (integer): Filter nodes and edges to those published $\le$ cutoffYear.
  - `nodeTypes` (string comma-separated): e.g. `Method,ResearchProblem,Paper`
  - `limit` (integer, default: 500)
- **Response:**
  ```json
  {
    "nodes": [ ... ],
    "edges": [ ... ],
    "cutoffYear": 2021,
    "totalNodes": 42,
    "totalEdges": 86
  }
  ```

### `GET /api/graph/:sessionId/stats`
Computes graph density, degree distribution, and node/edge breakdowns.

### `GET /api/graph/:sessionId/paths`
Finds multi-hop reasoning paths connecting two canonical entity IDs.
- **Query Parameters:** `source=method:rag&target=problem:hallucination&maxDepth=3`

---

## 3. Hypotheses (`/api/hypotheses`)

### `GET /api/hypotheses/:sessionId`
Returns ranked candidate cross-domain research hypotheses with composite scores and legacy RGCS.

### `GET /api/hypotheses/:sessionId/export`
Exports research findings.
- **Query Parameters:** `format=json|csv|markdown`

---

## 4. Evaluations & Historical Backtesting (`/api/evaluations`)

### `POST /api/evaluations/run`
Executes a chronological backtest run.
- **Request Body:**
  ```json
  {
    "cutoffYear": 2021,
    "evalStartYear": 2022,
    "evalEndYear": 2024
  }
  ```

### `GET /api/evaluations/latest`
Returns the latest benchmark metrics, baseline comparisons, and ablation studies.
