import { CheckCircle2, CircleDashed, Loader2, XCircle } from "lucide-react";

const STEP_LABELS = {
  paper_finder: { title: "Paper Finder", description: "Searching arXiv & Semantic Scholar" },
  classifier: { title: "Classifier", description: "Clustering papers into sub-topics" },
  graph_builder: { title: "TCKG Builder", description: "Building temporal knowledge graph" },
  literature_review: { title: "Literature Review", description: "Synthesizing structured review" },
  gap_detector: { title: "Gap Detector", description: "Scoring candidate gaps (RGCS)" },
  hypothesis_discovery: { title: "Hypotheses", description: "Graph-RAG link prediction" },
};

function StepIcon({ status }) {
  if (status === "completed") return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
  if (status === "running") return <Loader2 className="h-5 w-5 animate-spin text-brand-600" />;
  if (status === "failed") return <XCircle className="h-5 w-5 text-red-500" />;
  return <CircleDashed className="h-5 w-5 text-slate-300" />;
}

export default function PipelineProgress({ steps = [] }) {
  return (
    <ol className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {steps.map((step) => {
        const label = STEP_LABELS[step.step] || { title: step.step, description: "" };
        return (
          <li
            key={step.step}
            className={`rounded-xl border p-4 transition ${
              step.status === "running"
                ? "border-brand-300 bg-brand-50"
                : step.status === "failed"
                ? "border-red-200 bg-red-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <StepIcon status={step.status} />
              <span className="font-medium text-slate-900">{label.title}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{step.message || label.description}</p>
          </li>
        );
      })}
    </ol>
  );
}
