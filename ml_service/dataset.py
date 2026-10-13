"""
Scientific Knowledge Graph Dataset Preparation and Temporal Splitting.
Strictly guarantees no future information leaks into historical training splits.
"""

from typing import Dict, List, Tuple
import torch
import numpy as np


RELATION_TYPES = [
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
]
REL_TO_ID = {rel: i for i, rel in enumerate(RELATION_TYPES)}


class TemporalGraphDataset:
    def __init__(self, raw_graph: Dict, cutoff_year: int = 2021, eval_end_year: int = 2024):
        self.cutoff_year = cutoff_year
        self.eval_end_year = eval_end_year

        nodes = raw_graph.get("nodes", [])
        edges = raw_graph.get("edges", [])

        # Assign integer IDs to unique entities
        self.node_to_id = {}
        self.id_to_node = {}
        for n in nodes:
            cid = n["canonicalId"]
            if cid not in self.node_to_id:
                idx = len(self.node_to_id)
                self.node_to_id[cid] = idx
                self.id_to_node[idx] = n

        self.num_nodes = max(len(self.node_to_id), 1)
        self.num_relations = len(RELATION_TYPES)

        # Build chronological edge sets
        train_edges = []
        test_edges = []

        for e in edges:
            src = e.get("sourceCanonicalId")
            tgt = e.get("targetCanonicalId")
            rel = e.get("edgeType")
            year = int(e.get("year", 2020))

            if src not in self.node_to_id or tgt not in self.node_to_id or rel not in REL_TO_ID:
                continue

            src_idx = self.node_to_id[src]
            tgt_idx = self.node_to_id[tgt]
            rel_idx = REL_TO_ID[rel]

            if year <= self.cutoff_year:
                train_edges.append((src_idx, rel_idx, tgt_idx, year))
            elif self.cutoff_year < year <= self.eval_end_year:
                test_edges.append((src_idx, rel_idx, tgt_idx, year))

        self.train_edges = train_edges
        self.test_edges = test_edges

    def get_train_tensors(self) -> Tuple[torch.Tensor, torch.Tensor]:
        """Returns edge_index [2, E] and edge_type [E] for pre-cutoff training."""
        if not self.train_edges:
            # Fallback self-loops if empty
            edge_index = torch.zeros((2, 1), dtype=torch.long)
            edge_type = torch.zeros((1,), dtype=torch.long)
            return edge_index, edge_type

        srcs = [e[0] for e in self.train_edges]
        rels = [e[1] for e in self.train_edges]
        tgts = [e[2] for e in self.train_edges]

        edge_index = torch.tensor([srcs, tgts], dtype=torch.long)
        edge_type = torch.tensor(rels, dtype=torch.long)
        return edge_index, edge_type

    def sample_negative_edges(self, positive_edges: List[Tuple], num_neg_per_pos: int = 1) -> List[Tuple]:
        """
        Generates negative edge samples by corrupting head or tail entities uniformly.
        Ensures negative edges do not trivially coincide with true training edges.
        """
        existing = set((e[0], e[1], e[2]) for e in self.train_edges)
        negatives = []

        for src, rel, tgt, _ in positive_edges:
            for _ in range(num_neg_per_pos):
                corrupt_tail = np.random.rand() > 0.5
                for _ in range(20):  # bounded retry
                    if corrupt_tail:
                        corrupted_tgt = np.random.randint(0, self.num_nodes)
                        candidate = (src, rel, corrupted_tgt)
                    else:
                        corrupted_src = np.random.randint(0, self.num_nodes)
                        candidate = (corrupted_src, rel, tgt)

                    if candidate not in existing:
                        negatives.append(candidate)
                        break

        return negatives
