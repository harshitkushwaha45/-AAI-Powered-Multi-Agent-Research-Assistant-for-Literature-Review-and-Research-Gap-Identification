import axios from "axios";
import { parseStringPromise } from "xml2js";
import { logger } from "../utils/logger.js";

const ARXIV_API_URL = "https://export.arxiv.org/api/query";

/**
 * Searches arXiv's Atom feed API (free, keyless) and normalizes results
 * to the shared paper shape used across all sources.
 */
export async function searchArxiv(topic, maxResults = 20) {
  try {
    const cleanTopic = topic.trim().replace(/['"]/g, "").replace(/\s+/g, "+");
    const { data } = await axios.get(ARXIV_API_URL, {
      params: {
        search_query: `all:${cleanTopic}`,
        start: 0,
        max_results: Math.min(maxResults, 20),
        sortBy: "relevance",
        sortOrder: "descending",
      },
      headers: {
        "User-Agent": "ResearchMind/1.0 (academic-research-tool; mailto:contact@researchmind.app)",
      },
      timeout: 10000,
    });

    const parsed = await parseStringPromise(data, { explicitArray: false });
    const entries = parsed?.feed?.entry
      ? Array.isArray(parsed.feed.entry)
        ? parsed.feed.entry
        : [parsed.feed.entry]
      : [];

    return entries.map((entry) => {
      const arxivId = (entry.id || "").split("/abs/").pop() || `arxiv_${Math.random().toString(36).slice(2, 9)}`;
      const authors = Array.isArray(entry.author)
        ? entry.author.map((a) => a?.name).filter(Boolean)
        : entry.author
        ? [entry.author.name].filter(Boolean)
        : [];

      return {
        externalId: arxivId,
        source: "arxiv",
        title: (entry.title || "").replace(/\s+/g, " ").trim(),
        abstract: (entry.summary || "").replace(/\s+/g, " ").trim(),
        authors,
        year: entry.published ? new Date(entry.published).getFullYear() : undefined,
        doi: entry["arxiv:doi"] || undefined,
        url: entry.id,
        citationCount: 0, // arXiv does not expose citation counts
      };
    });
  } catch (err) {
    logger.warn(`arXiv search skipped or timed out: ${err.message}`);
    return [];
  }
}
