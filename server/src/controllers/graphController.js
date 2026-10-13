import { GraphRepository } from "../services/graphRepository.js";

export async function getSubgraph(req, res) {
  const { id } = req.params;
  const { cutoffYear, nodeTypes, limit } = req.query;

  const typesArray = nodeTypes ? nodeTypes.split(",").map((t) => t.trim()) : undefined;
  const parsedLimit = limit ? Math.min(1000, Math.max(10, Number(limit))) : 500;
  const parsedCutoff = cutoffYear ? Number(cutoffYear) : undefined;

  const result = await GraphRepository.getSubgraph(id, {
    cutoffYear: parsedCutoff,
    nodeTypes: typesArray,
    limit: parsedLimit,
  });

  res.json(result);
}

export async function getGraphStats(req, res) {
  const { id } = req.params;
  const { cutoffYear } = req.query;

  const stats = await GraphRepository.getGraphStats(id, {
    cutoffYear: cutoffYear ? Number(cutoffYear) : undefined,
  });

  res.json(stats);
}

export async function findGraphPaths(req, res) {
  const { id } = req.params;
  const { source, target, maxDepth, cutoffYear } = req.query;

  if (!source || !target) {
    return res.status(400).json({ error: "Query parameters 'source' and 'target' are required." });
  }

  const paths = await GraphRepository.findPaths(id, source, target, {
    maxDepth: maxDepth ? Number(maxDepth) : 3,
    cutoffYear: cutoffYear ? Number(cutoffYear) : undefined,
  });

  res.json({ source, target, paths });
}

export async function verifyGraphIntegrity(req, res) {
  const { id } = req.params;
  const integrity = await GraphRepository.verifyIntegrity(id);
  res.json(integrity);
}
