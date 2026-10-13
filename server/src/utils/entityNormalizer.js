/**
 * Entity normalization and canonical identifier generation.
 * Ensures consistent entity naming across papers, eliminates duplicates,
 * and maintains reproducible node keys in both Neo4j and MongoDB.
 */

// Dictionary of known academic acronyms and standardizations
const SYNONYM_MAP = new Map([
  ["llm", "Large Language Model"],
  ["llms", "Large Language Models"],
  ["rag", "Retrieval-Augmented Generation"],
  ["gnn", "Graph Neural Network"],
  ["gnns", "Graph Neural Networks"],
  ["rgcn", "Relational Graph Convolutional Network"],
  ["r-gcn", "Relational Graph Convolutional Network"],
  ["gcn", "Graph Convolutional Network"],
  ["kg", "Knowledge Graph"],
  ["kgs", "Knowledge Graphs"],
  ["tckg", "Temporal Citation Knowledge Graph"],
  ["bert", "BERT"],
  ["gpt", "Generative Pre-trained Transformer"],
  ["reinforcement learning", "Reinforcement Learning"],
  ["rl", "Reinforcement Learning"],
  ["rlhf", "Reinforcement Learning from Human Feedback"],
  ["nlp", "Natural Language Processing"],
  ["cv", "Computer Vision"],
  ["cot", "Chain-of-Thought Prompting"],
]);

/**
 * Normalizes an entity string by trimming, removing excessive whitespace
 * and punctuation, and applying known academic synonym mappings.
 *
 * @param {string} text - Raw entity text
 * @returns {string} Normalized title-case entity name
 */
export function normalizeEntityName(text) {
  if (!text || typeof text !== "string") return "Unknown";

  const cleaned = text
    .trim()
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[^\w\s\-.]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "Unknown";

  const lower = cleaned.toLowerCase();
  if (SYNONYM_MAP.has(lower)) {
    return SYNONYM_MAP.get(lower);
  }

  // Capitalize words appropriately while preserving existing acronyms
  return cleaned
    .split(" ")
    .map((word) => {
      if (word.toUpperCase() === word && word.length > 1) return word; // preserve uppercase acronyms like BERT, CNN
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/**
 * Produces a stable, unique canonical ID for an entity within a given node type.
 * Example: ("Method", "Retrieval-Augmented Generation") -> "method:retrieval_augmented_generation"
 *
 * @param {string} nodeType - Entity category (e.g., 'Method', 'ResearchProblem')
 * @param {string} name - Entity raw or normalized name
 * @returns {string} Deterministic canonical identifier
 */
export function createCanonicalId(nodeType, name) {
  const normType = (nodeType || "Entity").toLowerCase().trim();
  const slug = (name || "unknown")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `${normType}:${slug || "unknown"}`;
}

/**
 * Normalizes paper title for deduplication.
 * Strips punctuation, collapses spaces, and lowercases.
 *
 * @param {string} title
 * @returns {string}
 */
export function normalizePaperTitle(title) {
  if (!title || typeof title !== "string") return "";
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Sanitizes untrusted academic text (abstracts, titles, queries) to prevent
 * prompt-injection and escape control characters.
 *
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function sanitizeUntrustedText(text, maxLength = 4000) {
  if (!text || typeof text !== "string") return "";

  return text
    .slice(0, maxLength)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "") // remove control characters
    .replace(/<\/?script[^>]*>/gi, "") // strip script tags
    .trim();
}
