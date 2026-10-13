import { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  ShieldAlert,
  FlaskConical,
  BookOpen,
  ChevronDown,
  ChevronUp,
  GitBranch,
  Quote,
} from "lucide-react";

function scoreBadgeClass(score) {
  if (score >= 75) return "text-emerald-700 bg-emerald-50 border-emerald-300";
  if (score >= 50) return "text-amber-700 bg-amber-50 border-amber-300";
  return "text-slate-600 bg-slate-50 border-slate-300";
}

function ScoreProgressBar({ label, value }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-600 mb-1">
        <span>{label}</span>
        <span className="font-semibold text-slate-800">{value}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100">
        <div
          className="h-1.5 rounded-full bg-brand-600 transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

export default function HypothesisCard({ hypothesis }) {
  const [expanded, setExpanded] = useState(false);
  const breakdown = hypothesis.scoreBreakdown || {};

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300">
      {/* Top Header: Title, Cross-Domain Badges, Scores */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Candidate Hypothesis
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 capitalize">
              {hypothesis.verificationStatus?.replace(/_/g, " ") || "unverified candidate"}
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-1">
            {hypothesis.title}
          </h3>
        </div>

        {/* Dual Scores Comparison: Composite Score vs Legacy RGCS */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`rounded-lg border px-3 py-1.5 text-center ${scoreBadgeClass(
              hypothesis.compositeScore
            )}`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider">
              Composite
            </div>
            <div className="text-base font-bold">{hypothesis.compositeScore}</div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-center text-slate-700">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Legacy RGCS
            </div>
            <div className="text-base font-bold">{hypothesis.rgcsScore ?? "--"}</div>
          </div>
        </div>
      </div>

      {/* Hypothesis Statement */}
      <p className="mt-3 text-sm font-medium text-slate-800 leading-relaxed bg-brand-50/50 p-3 rounded-lg border border-brand-100">
        "{hypothesis.statement}"
      </p>

      {/* Cross-Domain Transfer Bridge */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <div className="flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-emerald-800 border border-emerald-200">
          <span className="font-semibold">Candidate Method:</span>
          <span>{hypothesis.candidateMethod}</span>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <div className="flex items-center gap-1 rounded bg-rose-50 px-2 py-1 text-rose-800 border border-rose-200">
          <span className="font-semibold">Target Problem:</span>
          <span>{hypothesis.targetProblem}</span>
        </div>
        <span className="text-slate-400">&middot;</span>
        <span className="text-slate-500">
          Domain Transfer: {(hypothesis.sourceDomains || []).join(", ") || "Methods"} &rarr;{" "}
          {hypothesis.targetDomain || "Target Field"}
        </span>
      </div>

      {/* Rationale */}
      <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
        <span className="font-semibold text-slate-700">Scientific Rationale: </span>
        {hypothesis.scientificRationale}
      </p>

      {/* Transparent Score Breakdown Bars */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-100 pt-3">
        <ScoreProgressBar
          label="Link Prediction"
          value={breakdown.linkPredictionScore ?? 70}
        />
        <ScoreProgressBar
          label="Evidence Quality"
          value={breakdown.evidenceCoverageScore ?? 75}
        />
        <ScoreProgressBar
          label="Novelty Proxy"
          value={breakdown.noveltyProxyScore ?? 70}
        />
        <ScoreProgressBar
          label="Feasibility"
          value={breakdown.feasibilityScore ?? 70}
        />
      </div>

      {/* Expand / Collapse Details Button */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition"
        >
          {expanded ? (
            <>
              Hide Evidence & Details <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              Inspect Supporting Evidence & Paths <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Collapsible Evidence, Graph Paths, Counterevidence, Validation Experiment */}
      {expanded && (
        <div className="mt-3 space-y-3.5 border-t border-slate-200 pt-3 text-xs">
          {/* Supporting Evidence Excerpts */}
          {hypothesis.evidenceExcerpts?.length > 0 && (
            <div>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mb-1.5">
                <Quote className="h-3.5 w-3.5 text-brand-600" />
                Verbatim Evidence Excerpts from Literature:
              </span>
              <div className="space-y-1.5">
                {hypothesis.evidenceExcerpts.map((excerpt, idx) => (
                  <div
                    key={idx}
                    className="rounded bg-slate-50 p-2.5 text-slate-700 italic border-l-2 border-brand-500"
                  >
                    "{excerpt}"
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Graph Reasoning Paths */}
          {hypothesis.graphPaths?.length > 0 && (
            <div>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mb-1.5">
                <GitBranch className="h-3.5 w-3.5 text-brand-600" />
                Knowledge Graph Multi-Hop Reasoning Path:
              </span>
              <div className="space-y-1">
                {hypothesis.graphPaths.map((pathSteps, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-2 rounded text-[11px] font-mono text-slate-700"
                  >
                    {pathSteps.map((step, sIdx) => (
                      <span key={sIdx} className="flex items-center gap-1">
                        <span className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">
                          {step.from}
                        </span>
                        <span className="text-brand-600 font-bold text-[10px]">
                          --[{step.relationship}]--&gt;
                        </span>
                        <span className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">
                          {step.to}
                        </span>
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Counterevidence and Limitations */}
          {(hypothesis.limitations?.length > 0 || hypothesis.counterevidence?.length > 0) && (
            <div className="rounded-lg bg-amber-50/70 border border-amber-200 p-3">
              <span className="font-semibold text-amber-900 flex items-center gap-1 mb-1">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-700" />
                Known Limitations & Potential Counterevidence:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                {(hypothesis.limitations || []).map((lim, i) => (
                  <li key={`lim-${i}`}>{lim}</li>
                ))}
                {(hypothesis.counterevidence || []).map((cev, i) => (
                  <li key={`cev-${i}`}>{cev}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Validation Experiment */}
          {hypothesis.recommendedValidationExperiment && (
            <div className="rounded-lg bg-emerald-50/70 border border-emerald-200 p-3">
              <span className="font-semibold text-emerald-900 flex items-center gap-1 mb-1">
                <FlaskConical className="h-3.5 w-3.5 text-emerald-700" />
                Recommended Empirical Validation Protocol:
              </span>
              <p className="text-emerald-800 leading-relaxed">
                {hypothesis.recommendedValidationExperiment}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
