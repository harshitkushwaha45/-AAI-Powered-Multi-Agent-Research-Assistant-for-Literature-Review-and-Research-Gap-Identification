import { askLLMJSON } from "../services/llmService.js";
import { GraphRagService } from "../services/graphRagService.js";
import { LinkPredictionService } from "../services/linkPredictionService.js";
import { Hypothesis } from "../models/Hypothesis.js";
import { Paper } from "../models/Paper.js";
import { logger } from "../utils/logger.js";

const HYPOTHESIS_SYSTEM_PROMPT = `You are a Principal Scientific Hypothesis Discovery Agent.
Given a set of cross-domain candidate bridge connections (a Method successfully utilized
in one subfield, paired with an unaddressed Research Problem in another subfield) and
grounded paper evidence, synthesize structured scientific research hypotheses.

STRICT SCIENTIFIC GUIDELINES:
1. A candidate hypothesis is an INVESTIGABLE PROPOSAL, not a proven fact.
2. Ground the hypothesis in the provided evidence. DO NOT invent citations or benchmark results.
3. Explicitly document potential counterevidence, domain transfer bottlenecks, or limitations.
4. Formulate a concrete, reproducible validation experiment that a researcher could perform.
5. If the evidence is inadequate for a bridge pair, do not force an unrealistic hypothesis.`;

function buildPrompt(topic, rankedBridges) {
  const bridgeDescriptions = rankedBridges.map((b, i) => {
    const method = b.methodNode.name;
    const problem = b.problemNode.name;
    const evidence = (b.evidenceExcerpts || []).slice(0, 3).join("\n- ");
    const pathDesc = (b.paths || []).slice(0, 1).map((p) =>
      p.map((step) => `${step.from} --[${step.relationship}]--> ${step.to}`).join(" -> ")
    ).join("; ");

    return `[Bridge Candidate ${i + 1}]
Candidate Method: ${method}
Target Problem: ${problem}
Graph Reasoning Path: ${pathDesc || "Topological co-occurrence"}
Supporting Evidence Excerpts:
- ${evidence || "Direct thematic adjacency"}
Link Prediction Affinity Score: ${b.scores?.proposedModelScore ?? 75}/100`;
  }).join("\n\n");

  return `Research Topic: ${topic}

Candidate Cross-Domain Bridges:
${bridgeDescriptions}

Synthesize 3-5 structured research hypotheses adhering to this JSON format:
{
  "hypotheses": [
    {
      "candidateIndex": number, // 1-indexed matching Candidate number
      "title": string,
      "statement": string, // Formal scientific hypothesis statement
      "sourceDomains": string[], // Research area(s) where the method originates
      "targetDomain": string, // Subfield where the problem resides
      "scientificRationale": string, // Why the method's mechanism should address the problem
      "limitations": string[], // Inherent technical or conceptual bottlenecks
      "counterevidence": string[], // Known trade-offs or failure modes
      "feasibilityConsiderations": string, // Computational/data constraints
      "recommendedValidationExperiment": string, // Concrete experiment design to test hypothesis
      "estimatedNovelty": number, // 0-100 estimate
      "estimatedFeasibility": number // 0-100 estimate
    }
  ]
}`;
}

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Computes original RGCS score for comparison.
 */
function computeLegacyRGCS(supportingPapers, allPapers, llmNovelty = 60) {
  const total = allPapers.length || 1;
  const count = supportingPapers.length;

  const sparsity = Math.min(100, Math.max(0, Math.round(100 * (1 - count / total))));

  const avgAge =
    supportingPapers.reduce(
      (sum, p) => sum + Math.min(CURRENT_YEAR - (p.year || CURRENT_YEAR), 10),
      0
    ) / (count || 1);
  const recency = Math.min(100, Math.max(0, Math.round(100 * (1 - avgAge / 10))));

  const velocity = (p) => (p.citationCount || 0) / (CURRENT_YEAR - (p.year || CURRENT_YEAR) + 1);
  const maxVelocity = Math.max(...allPapers.map(velocity), 1);
  const avgVelocity = supportingPapers.reduce((sum, p) => sum + velocity(p), 0) / (count || 1);
  const citationTrend = Math.min(100, Math.max(0, Math.round(100 * (avgVelocity / maxVelocity))));

  const rgcs = Math.round(
    0.40 * sparsity + 0.25 * recency + 0.20 * citationTrend + 0.15 * llmNovelty
  );

  return Math.min(100, Math.max(0, rgcs));
}

/**
 * Discovers, ranks, and persists cross-domain scientific hypotheses.
 *
 * @param {string} sessionId
 * @param {string} topic
 * @param {Object} [options]
 */
export async function runHypothesisDiscovery(sessionId, topic, options = {}) {
  const { cutoffYear } = options;
  logger.info(`Running Hypothesis Discovery for session ${sessionId}...`);

  // 1. Retrieve Graph-RAG grounded candidates
  const groundedContext = await GraphRagService.retrieveGroundedContext(sessionId, topic, {
    cutoffYear,
    maxCandidates: 8,
  });

  if (groundedContext.candidateBridges.length === 0) {
    logger.info("No cross-domain bridge candidates found in current subgraph.");
    return [];
  }

  // 2. Rank bridges using Link Prediction Service (Baselines + Proposed Model)
  const rankedBridges = await LinkPredictionService.rankCandidatePairs(
    groundedContext.subgraph,
    groundedContext.candidateBridges,
    { cutoffYear }
  );

  // 3. Synthesize structured hypotheses via Gemini
  let synthesized = [];
  try {
    const response = await askLLMJSON(
      HYPOTHESIS_SYSTEM_PROMPT,
      buildPrompt(topic, rankedBridges.slice(0, 5)),
      6000
    );
    synthesized = Array.isArray(response.hypotheses) ? response.hypotheses : [];
  } catch (llmErr) {
    logger.warn(`LLM hypothesis synthesis fallback (${llmErr.message}); using template synthesis.`);
    synthesized = rankedBridges.slice(0, 4).map((b, idx) => ({
      candidateIndex: idx + 1,
      title: `Applying ${b.methodNode.name} to ${b.problemNode.name}`,
      statement: `We hypothesize that adapting ${b.methodNode.name} can resolve the performance bottleneck in ${b.problemNode.name}.`,
      sourceDomains: ["Computational Methods"],
      targetDomain: topic,
      scientificRationale: `Method demonstrates strong relational characteristics applicable to ${b.problemNode.name}.`,
      limitations: ["Potential domain distribution shift"],
      counterevidence: ["Increased computational latency"],
      feasibilityConsiderations: "Standard GPU evaluation setup required",
      recommendedValidationExperiment: `Benchmark ${b.methodNode.name} against baseline approaches on target task.`,
      estimatedNovelty: 75,
      estimatedFeasibility: 70,
    }));
  }

  // 4. Calculate transparent composite ranking and legacy RGCS
  const allPapers = await Paper.find({ sessionId }).lean();
  const paperMap = new Map(allPapers.map((p) => [String(p._id), p]));

  const hypothesesDocs = [];
  for (const item of synthesized) {
    const bridgeIdx = (item.candidateIndex || 1) - 1;
    const bridge = rankedBridges[bridgeIdx] || rankedBridges[0];

    const linkPredictionScore = bridge.scores?.proposedModelScore ?? 70;
    const evidenceCoverageScore = Math.min(100, (bridge.evidenceExcerpts?.length || 1) * 30);
    const noveltyProxyScore = Math.min(100, Math.max(20, item.estimatedNovelty || 75));
    const feasibilityScore = Math.min(100, Math.max(20, item.estimatedFeasibility || 70));

    // Transparent Composite Ranking Formula
    const compositeScore = Math.round(
      0.35 * linkPredictionScore +
      0.30 * evidenceCoverageScore +
      0.20 * noveltyProxyScore +
      0.15 * feasibilityScore
    );

    // Supporting papers
    const supportingPapers = (bridge.supportingPaperIds || [])
      .map((id) => paperMap.get(String(id)))
      .filter(Boolean);

    // Compute legacy RGCS score for direct comparison
    const rgcsScore = computeLegacyRGCS(supportingPapers, allPapers, noveltyProxyScore);

    // Format graph paths
    const formattedPaths = (bridge.paths || []).map((pathSteps) =>
      pathSteps.map((s) => ({
        from: s.from || "",
        relationship: s.relationship || "RELATED",
        to: s.to || "",
      }))
    );

    hypothesesDocs.push({
      sessionId,
      title: item.title,
      statement: item.statement,
      sourceDomains: item.sourceDomains || ["Machine Learning"],
      targetDomain: item.targetDomain || topic,
      candidateMethod: bridge.methodNode.name,
      targetProblem: bridge.problemNode.name,
      scientificRationale: item.scientificRationale,
      supportingPaperIds: supportingPapers.map((p) => p._id),
      supportingPaperTitles: supportingPapers.map((p) => p.title),
      evidenceExcerpts: bridge.evidenceExcerpts || [],
      graphPaths: formattedPaths,
      limitations: item.limitations || [],
      counterevidence: item.counterevidence || [],
      feasibilityConsiderations: item.feasibilityConsiderations || "",
      recommendedValidationExperiment: item.recommendedValidationExperiment || "",
      scoreBreakdown: {
        linkPredictionScore,
        evidenceCoverageScore,
        noveltyProxyScore,
        feasibilityScore,
      },
      compositeScore,
      rgcsScore,
      historicalCutoffYear: cutoffYear ? Number(cutoffYear) : null,
      verificationStatus: "unverified_candidate",
    });
  }

  // Clear previous hypotheses for session and persist new ones
  await Hypothesis.deleteMany({ sessionId });
  const created = await Hypothesis.insertMany(hypothesesDocs);

  logger.info(`Hypothesis discovery complete: ${created.length} hypotheses generated.`);
  return created.sort((a, b) => b.compositeScore - a.compositeScore);
}
