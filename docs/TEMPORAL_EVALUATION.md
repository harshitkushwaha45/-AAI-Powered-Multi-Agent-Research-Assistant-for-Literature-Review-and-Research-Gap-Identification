# Temporal Evaluation & Data Leakage Prevention Protocol

**Official Project Title:**  
*ResearchMind: An AI-Powered Multi-Agent Research Assistant for Literature Review and Research Gap Identification*

---

## 1. Principles of Chronological Graph Partitioning

In academic literature prediction tasks, **data leakage** is the most frequent flaw in published literature:
- Using future citation counts to weight historical nodes.
- Including graph edges discovered in post-cutoff papers when training representations.
- Permitting LLM reasoning to refer to post-cutoff publications during hypothesis generation.

ResearchMind enforces rigorous temporal partitioning at four levels:

```
========================================================================
HISTORICAL CUTOFF DATE: 2021-12-31
------------------------------------------------------------------------
[TRAINING & PREDICTION PHASE] (Year <= 2021)
  * Papers published <= 2021 included in vector index and TCKG.
  * GraphNode.firstSeenYear <= 2021.
  * GraphEdge.year <= 2021.
  * Model trained strictly on pre-cutoff subgraph.
  * Hypotheses generated solely from pre-cutoff evidence and graph walks.
------------------------------------------------------------------------
[HELD-OUT EVALUATION WINDOW] (2022 <= Year <= 2024)
  * Papers published between 2022 and 2024 held out completely.
  * Candidate pairs ranked by the model are tested against emergent links.
  * A true connection occurs when a post-cutoff paper documents the pair.
========================================================================
```

---

## 2. Temporal Masking Implementation

In `GraphRepository.getSubgraph(sessionId, { cutoffYear })`:
```javascript
if (cutoffYear) {
  nodeFilter.firstSeenYear = { $lte: Number(cutoffYear) };
  edgeFilter.year = { $lte: Number(cutoffYear) };
}
```
All multi-hop graph walks in `GraphRagService` operate exclusively upon this filtered temporal subgraph snapshot.

---

## 3. Walk-Forward Backtesting

The system supports configurable sliding evaluation windows:
- Window 1: Train $\le 2020$, Test $[2021-2022]$
- Window 2: Train $\le 2021$, Test $[2022-2024]$
- Window 3: Train $\le 2022$, Test $[2023-2024]$

This ensures that model performance is measured across evolving citation regimes rather than a single fixed snapshot.
