"""
Relational Graph Convolutional Network (R-GCN) Link Prediction Model.
Implemented in PyTorch for CPU-compatible relation-aware knowledge graph learning.

Architecture:
1. Entity Embedding Layer (learnable representation per entity)
2. 2-layer Relational GCN with relation-specific weight matrices and basis/block decomposition
3. DistMult Link Prediction Decoder: score(s, r, o) = s^T * diag(R_r) * o
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class RGCNLayer(nn.Module):
    def __init__(self, in_features: int, out_features: int, num_relations: int, dropout: float = 0.2):
        super(RGCNLayer, self).__init__()
        self.in_features = in_features
        self.out_features = out_features
        self.num_relations = num_relations

        # Relation-specific transformation matrices W_r
        self.weight = nn.Parameter(torch.Tensor(num_relations, in_features, out_features))
        self.self_loop_weight = nn.Parameter(torch.Tensor(in_features, out_features))
        self.bias = nn.Parameter(torch.Tensor(out_features))
        self.dropout = nn.Dropout(dropout)

        self.reset_parameters()

    def reset_parameters(self):
        nn.init.xavier_uniform_(self.weight)
        nn.init.xavier_uniform_(self.self_loop_weight)
        nn.init.zeros_(self.bias)

    def forward(self, x: torch.Tensor, edge_index: torch.Tensor, edge_type: torch.Tensor) -> torch.Tensor:
        """
        x: [num_nodes, in_features]
        edge_index: [2, num_edges] (source, target)
        edge_type: [num_edges]
        """
        num_nodes = x.size(0)
        out = torch.zeros(num_nodes, self.out_features, device=x.device)

        # Message passing per relation type
        for r in range(self.num_relations):
            mask = (edge_type == r)
            if not mask.any():
                continue

            src = edge_index[0, mask]
            tgt = edge_index[1, mask]

            # Linear transform for relation r
            w_r = self.weight[r]
            msg = torch.matmul(x[src], w_r)

            # Degree normalization
            deg = torch.zeros(num_nodes, device=x.device)
            deg.scatter_add_(0, tgt, torch.ones_like(tgt, dtype=torch.float))
            norm = 1.0 / deg[tgt].clamp(min=1.0).unsqueeze(-1)
            msg = msg * norm

            out.scatter_add_(0, tgt.unsqueeze(-1).expand_as(msg), msg)

        # Self-loop connection
        self_loop = torch.matmul(x, self.self_loop_weight)
        out = out + self_loop + self.bias
        return self.dropout(F.relu(out))


class RGCNLinkPredictor(nn.Module):
    def __init__(self, num_nodes: int, num_relations: int, hidden_dim: int = 64, out_dim: int = 32):
        super(RGCNLinkPredictor, self).__init__()
        self.num_nodes = num_nodes
        self.num_relations = num_relations
        self.embedding = nn.Embedding(num_nodes, hidden_dim)

        self.conv1 = RGCNLayer(hidden_dim, hidden_dim, num_relations)
        self.conv2 = RGCNLayer(hidden_dim, out_dim, num_relations)

        # Relation diagonal weights for DistMult decoder
        self.rel_diag = nn.Parameter(torch.Tensor(num_relations, out_dim))

        self.reset_parameters()

    def reset_parameters(self):
        nn.init.xavier_uniform_(self.embedding.weight)
        nn.init.xavier_uniform_(self.rel_diag)

    def encode(self, edge_index: torch.Tensor, edge_type: torch.Tensor) -> torch.Tensor:
        x = self.embedding.weight
        h1 = self.conv1(x, edge_index, edge_type)
        h2 = self.conv2(h1, edge_index, edge_type)
        return h2

    def score(self, embeddings: torch.Tensor, src: torch.Tensor, rel: torch.Tensor, tgt: torch.Tensor) -> torch.Tensor:
        """
        DistMult scoring function: score = sum(s * R_r * o, dim=-1)
        """
        h_s = embeddings[src]
        r_w = self.rel_diag[rel]
        h_o = embeddings[tgt]
        return torch.sum(h_s * r_w * h_o, dim=-1)
