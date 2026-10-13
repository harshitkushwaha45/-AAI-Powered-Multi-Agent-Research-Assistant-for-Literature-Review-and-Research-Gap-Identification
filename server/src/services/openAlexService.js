import axios from "axios";
import { logger } from "../utils/logger.js";

const OPENALEX_API_URL = "https://api.openalex.org/works";

function reconstructAbstract(invertedIndex) {
  if (!invertedIndex || typeof invertedIndex !== "object") return "";
  const words = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    if (Array.isArray(positions)) {
      for (const pos of positions) {
        words[pos] = word;
      }
    }
  }
  return words.filter(Boolean).join(" ").trim();
}

/**
 * Searches OpenAlex free academic catalog (over 250M works, keyless, fast, high availability).
 */
export async function searchOpenAlex(topic, maxResults = 15) {
  try {
    const { data } = await axios.get(OPENALEX_API_URL, {
      params: {
        search: topic,
        per_page: Math.min(maxResults, 25),
        sort: "relevance_score:desc",
      },
      headers: {
        "User-Agent": "ResearchMind-Agent/1.0 (academic-research; mailto:team@researchmind.org)",
      },
      timeout: 8000,
    });

    const results = Array.isArray(data.results) ? data.results : [];
    return results.map((paper) => {
      const externalId =
        (paper.id || "").replace("https://openalex.org/", "") ||
        `oa_${Math.random().toString(36).slice(2, 9)}`;

      const authors = Array.isArray(paper.authorships)
        ? paper.authorships
            .map((a) => a.author?.display_name)
            .filter(Boolean)
        : [];

      const abstract =
        reconstructAbstract(paper.abstract_inverted_index) ||
        (paper.title ? `Research investigation focusing on ${paper.title}` : "");

      return {
        externalId,
        source: "openalex",
        title: (paper.title || "Untitled Research").replace(/\s+/g, " ").trim(),
        abstract: abstract.replace(/\s+/g, " ").trim(),
        authors,
        year: paper.publication_year || undefined,
        doi: paper.doi || undefined,
        url: paper.doi || paper.primary_location?.landing_page_url || paper.id || "",
        citationCount: paper.cited_by_count || 0,
      };
    });
  } catch (err) {
    logger.warn(`OpenAlex search skipped or failed: ${err.message}`);
    return [];
  }
}
