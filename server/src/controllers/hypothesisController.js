import { Hypothesis } from "../models/Hypothesis.js";
import { ResearchSession } from "../models/ResearchSession.js";

export async function getSessionHypotheses(req, res) {
  const { id } = req.params;
  const hypotheses = await Hypothesis.find({ sessionId: id })
    .sort({ compositeScore: -1 })
    .lean();
  res.json(hypotheses);
}

export async function exportSessionReport(req, res) {
  const { id } = req.params;
  const { format = "json" } = req.query;

  const [session, hypotheses] = await Promise.all([
    ResearchSession.findById(id).lean(),
    Hypothesis.find({ sessionId: id }).sort({ compositeScore: -1 }).lean(),
  ]);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (format === "csv") {
    const headers = [
      "Title",
      "Candidate Method",
      "Target Problem",
      "Source Domains",
      "Target Domain",
      "Composite Score",
      "RGCS Score",
      "Link Prediction Score",
      "Evidence Coverage",
      "Novelty Proxy",
      "Feasibility Score",
      "Status",
    ];

    const rows = hypotheses.map((h) => [
      `"${(h.title || "").replace(/"/g, '""')}"`,
      `"${(h.candidateMethod || "").replace(/"/g, '""')}"`,
      `"${(h.targetProblem || "").replace(/"/g, '""')}"`,
      `"${(h.sourceDomains || []).join("; ").replace(/"/g, '""')}"`,
      `"${(h.targetDomain || "").replace(/"/g, '""')}"`,
      h.compositeScore,
      h.rgcsScore,
      h.scoreBreakdown?.linkPredictionScore ?? 0,
      h.scoreBreakdown?.evidenceCoverageScore ?? 0,
      h.scoreBreakdown?.noveltyProxyScore ?? 0,
      h.scoreBreakdown?.feasibilityScore ?? 0,
      h.verificationStatus,
    ]);

    const csvData = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="researchmind_hypotheses_${id}.csv"`);
    return res.send(csvData);
  }

  // Markdown format export
  if (format === "markdown" || format === "md") {
    let md = `# ResearchMind Scientific Discovery Report\n\n`;
    md += `**Topic:** ${session.topic}\n`;
    md += `**Status:** ${session.status}\n`;
    md += `**Papers Analyzed:** ${session.paperCount}\n`;
    md += `**Generated Date:** ${new Date().toISOString()}\n\n`;

    md += `## 1. Candidate Research Hypotheses (Ranked)\n\n`;
    for (const h of hypotheses) {
      md += `### ${h.title} (Composite Score: ${h.compositeScore}/100 | RGCS: ${h.rgcsScore}/100)\n\n`;
      md += `**Hypothesis Statement:** ${h.statement}\n\n`;
      md += `- **Candidate Method:** ${h.candidateMethod} (Domain: ${(h.sourceDomains || []).join(", ")})\n`;
      md += `- **Target Problem:** ${h.targetProblem} (Domain: ${h.targetDomain})\n`;
      md += `- **Scientific Rationale:** ${h.scientificRationale}\n`;
      md += `- **Recommended Experiment:** ${h.recommendedValidationExperiment || "None"}\n`;
      md += `- **Limitations:** ${(h.limitations || []).join("; ")}\n\n`;
      if (h.evidenceExcerpts?.length) {
        md += `**Supporting Evidence:**\n`;
        for (const ev of h.evidenceExcerpts) {
          md += `> "${ev}"\n\n`;
        }
      }
    }

    res.setHeader("Content-Type", "text/markdown");
    res.setHeader("Content-Disposition", `attachment; filename="researchmind_report_${id}.md"`);
    return res.send(md);
  }

  // JSON default export
  res.json({
    session,
    hypotheses,
    exportTimestamp: new Date(),
  });
}
