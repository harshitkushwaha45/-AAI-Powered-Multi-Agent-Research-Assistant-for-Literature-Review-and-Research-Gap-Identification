import { Paper } from "../models/Paper.js";
import { env } from "../config/env.js";
import { cosineSimilarity } from "./embeddingService.js";
import { logger } from "../utils/logger.js";

/**
 * Finds the papers most similar to a query embedding within a session.
 *
 * Tries MongoDB Atlas Vector Search ($vectorSearch) first (when running against
 * MongoDB Atlas with a vector index created via `npm run create-vector-index`).
 * If the index isn't present or during local MongoDB development, it automatically
 * falls back to an exact in-memory cosine similarity scan — session paper counts are
 * focused (tens to hundreds), providing a fast, zero-setup default.
 */
export async function findSimilarPapers(sessionId, queryEmbedding, limit = 5) {
  try {
    const results = await Paper.aggregate([
      {
        $vectorSearch: {
          index: env.vectorIndexName,
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 200,
          limit,
          filter: { sessionId },
        },
      },
      { $set: { score: { $meta: "vectorSearchScore" } } },
    ]);

    if (results.length > 0) return results;
    throw new Error("empty result, falling back");
  } catch (err) {
    logger.warn(
      `Atlas $vectorSearch unavailable (${err.message}); using in-memory cosine similarity fallback. ` +
        "Run `npm run create-vector-index` in server/ once your Mongo deployment supports Atlas Search."
    );
    return inMemorySimilaritySearch(sessionId, queryEmbedding, limit);
  }
}

async function inMemorySimilaritySearch(sessionId, queryEmbedding, limit) {
  const papers = await Paper.find({ sessionId, embedding: { $exists: true } }).lean();
  return papers
    .map((paper) => ({ ...paper, score: cosineSimilarity(queryEmbedding, paper.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
