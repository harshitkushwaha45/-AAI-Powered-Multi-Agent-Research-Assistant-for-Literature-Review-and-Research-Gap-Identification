import { ResearchSession } from "../models/ResearchSession.js";
import { runPaperFinder } from "./paperFinderAgent.js";
import { runClassifier } from "./classifierAgent.js";
import { runLiteratureReview } from "./literatureReviewAgent.js";
import { runGapDetector } from "./gapDetectorAgent.js";
import { buildKnowledgeGraph } from "./graphBuilderAgent.js";
import { runHypothesisDiscovery } from "./hypothesisDiscoveryAgent.js";
import { logger } from "../utils/logger.js";

async function setStep(sessionId, step, status, message = "") {
  const now = new Date();
  const update = {
    "steps.$[s].status": status,
    "steps.$[s].message": message,
  };
  if (status === "running") update["steps.$[s].startedAt"] = now;
  if (status === "completed" || status === "failed") update["steps.$[s].completedAt"] = now;

  await ResearchSession.updateOne(
    { _id: sessionId },
    { $set: update },
    { arrayFilters: [{ "s.step": step }] }
  );
}

/**
 * Runs the upgraded 6-agent sequential pipeline:
 * 1. Paper Finder
 * 2. Classifier
 * 3. Knowledge Graph Builder (TCKG)
 * 4. Literature Review Writer
 * 5. Gap Detector (RGCS scoring)
 * 6. Cross-Domain Hypothesis Discovery (Graph-RAG + Link Prediction)
 */
export async function runPipeline(sessionId) {
  const session = await ResearchSession.findById(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);

  const topic = session.topic;
  const cutoffYear = session.historicalCutoffYear;
  let currentStep = null;

  try {
    await ResearchSession.updateOne({ _id: sessionId }, { $set: { status: "running" } });

    // Agent 1 — Paper Finder
    currentStep = "paper_finder";
    await setStep(sessionId, currentStep, "running", "Searching arXiv and Semantic Scholar...");
    const papers = await runPaperFinder(sessionId, topic);
    await ResearchSession.updateOne({ _id: sessionId }, { $set: { paperCount: papers.length } });
    await setStep(sessionId, currentStep, "completed", `Found ${papers.length} papers`);

    // Agent 2 — Classifier
    currentStep = "classifier";
    await setStep(sessionId, currentStep, "running", "Clustering papers into themes with Gemini...");
    const { papers: classifiedPapers, clusters } = await runClassifier(sessionId, topic, papers);
    await ResearchSession.updateOne({ _id: sessionId }, { $set: { clusters } });
    await setStep(sessionId, currentStep, "completed", `${clusters.length} clusters identified`);

    // Agent 3 — Knowledge Graph Builder (TCKG)
    currentStep = "graph_builder";
    await setStep(sessionId, currentStep, "running", "Extracting scientific entities and building graph...");
    const graphStats = await buildKnowledgeGraph(sessionId, classifiedPapers, topic);
    await ResearchSession.updateOne(
      { _id: sessionId },
      {
        $set: {
          "graphStats.nodeCount": graphStats.nodeCount,
          "graphStats.edgeCount": graphStats.edgeCount,
        },
      }
    );
    await setStep(
      sessionId,
      currentStep,
      "completed",
      `Constructed graph: ${graphStats.nodeCount} nodes, ${graphStats.edgeCount} edges`
    );

    // Agent 4 — Literature Review
    currentStep = "literature_review";
    await setStep(sessionId, currentStep, "running", "Synthesizing cross-paper review...");
    const literatureReview = await runLiteratureReview(topic, classifiedPapers, clusters);
    await ResearchSession.updateOne({ _id: sessionId }, { $set: { literatureReview } });
    await setStep(sessionId, currentStep, "completed", "Structured literature review generated");

    // Agent 5 — Gap Detector
    currentStep = "gap_detector";
    await setStep(sessionId, currentStep, "running", "Evaluating topic and citation sparsity...");
    const gaps = await runGapDetector(topic, classifiedPapers, clusters);
    await ResearchSession.updateOne({ _id: sessionId }, { $set: { gaps } });
    await setStep(sessionId, currentStep, "completed", `${gaps.length} candidate gaps found`);

    // Agent 6 — Cross-Domain Hypothesis Discovery (Graph-RAG & Link Prediction)
    currentStep = "hypothesis_discovery";
    await setStep(sessionId, currentStep, "running", "Scoring candidate hypotheses with Graph-RAG...");
    const hypotheses = await runHypothesisDiscovery(sessionId, topic, { cutoffYear });
    await ResearchSession.updateOne(
      { _id: sessionId },
      { $set: { hypothesisCount: hypotheses.length } }
    );
    await setStep(
      sessionId,
      currentStep,
      "completed",
      `Discovered ${hypotheses.length} grounded cross-domain hypotheses`
    );

    await ResearchSession.updateOne({ _id: sessionId }, { $set: { status: "completed" } });
    logger.info(`Full ResearchMind pipeline completed for session ${sessionId}`);
  } catch (err) {
    logger.error(`Pipeline failed for session ${sessionId} at step ${currentStep}: ${err.message}`);

    if (currentStep) await setStep(sessionId, currentStep, "failed", err.message);

    await ResearchSession.updateOne(
      { _id: sessionId },
      { $set: { status: "failed", errorMessage: err.message } }
    );
  }
}
