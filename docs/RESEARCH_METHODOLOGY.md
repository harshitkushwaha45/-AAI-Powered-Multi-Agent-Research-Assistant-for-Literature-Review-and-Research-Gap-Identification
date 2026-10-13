# Research Methodology: Evidence-Grounded Scientific Link Prediction

**Official Project Title:**  
*ResearchMind: An AI-Powered Multi-Agent Research Assistant for Literature Review and Research Gap Identification*

---

## 1. Central Research Question

> **Central Research Objective:**  
> To investigate whether temporal graph structure and evidence-grounded multi-hop retrieval (Graph-RAG) improve the ranking of candidate cross-domain scientific connections before their eventual documentation in scientific literature, relative to text-only and static graph baselines.

---

## 2. Hypothesis Formulation & Scientific Boundaries

1. **Non-Certainty Clause:** ResearchMind does not claim to predict genuine scientific breakthroughs with certainty. All generated proposals are explicitly cataloged as **candidate research hypotheses**, accompanied by supporting citations, graph paths, limitations, and verification status.
2. **Untrusted Literature Clause:** Scientific documents are treated as untrusted input. Extraction pipelines enforce strict boundary sanitization to mitigate adversarial prompt-injection risks.
3. **No Information Leakage Guarantee:** Historical predictions are generated strictly under a chronological cutoff date $T_{\text{cutoff}}$. Papers, citations, and relationships published after $T_{\text{cutoff}}$ are masked from feature extraction, vector indexes, and graph construction.

---

## 3. Evaluated Models & Baselines

### Baseline 1: Semantic Similarity Baseline
Ranks potential method-problem pairs using dense vector cosine similarity:
$$\text{Sim}_{\text{semantic}}(m, p) = \cos(\mathbf{e}_m, \mathbf{e}_p) = \frac{\mathbf{e}_m \cdot \mathbf{e}_p}{\|\mathbf{e}_m\| \|\mathbf{e}_p\|}$$
where $\mathbf{e} \in \mathbb{R}^{384}$ is derived from the in-process `all-MiniLM-L6-v2` embedding model.

### Baseline 2: Static Graph Topology Baseline
Ranks pairs using structural graph heuristics on the unweighted co-occurrence graph:
- **Common Neighbors:** $|\mathcal{N}(m) \cap \mathcal{N}(p)|$
- **Jaccard Index:** $\frac{|\mathcal{N}(m) \cap \mathcal{N}(p)|}{|\mathcal{N}(m) \cup \mathcal{N}(p)|}$
- **Adamic-Adar Index:** $\sum_{z \in \mathcal{N}(m) \cap \mathcal{N}(p)} \frac{1}{\log |\mathcal{N}(z)|}$

### Baseline 3: Temporal Baseline (No Graph-RAG)
Weights edges chronologically according to recency and historical velocity without multi-hop path reasoning or verified verbatim excerpt grounding.

### Proposed Method: Relation-Aware Temporal Graph Model + Graph-RAG
Combines Relational Graph Convolutional Network (R-GCN) message passing with multi-hop topological traversal, dense semantic affinity, and verbatim evidentiary quote extraction:
$$S_{\text{proposed}} = 0.35 \cdot S_{\text{semantic}} + 0.30 \cdot S_{\text{temporal}} + 0.25 \cdot S_{\text{static}} + 0.10 \cdot S_{\text{evidence}}$$

---

## 4. Evaluation Protocol

- **Historical Training Window:** Literature published $\le 2021$.
- **Held-Out Evaluation Window:** Literature published between $2022$ and $2024$.
- **Positive Label Definition:** A true positive is defined as a candidate (Method, Problem) pair that was unconnected in the historical graph ($\le 2021$) but is empirically documented in a verified peer-reviewed paper in the held-out window ($2022-2024$).
- **Primary Metrics:**
  - Mean Reciprocal Rank (MRR)
  - Hits@1, Hits@3, Hits@5, Hits@10
  - Precision@K and Recall@K ($K \in \{1, 5, 10\}$)
  - Evidence Excerpt Coverage
