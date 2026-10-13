import {
  Search,
  Loader2,
  BookOpen,
  Target,
  Sparkles,
  Network,
  GitCompare,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

const PIPELINE_STEPS = [
  {
    name: "1. Paper Finder",
    meaning:
      "Federated parallel search across OpenAlex (250M+ catalog), arXiv, and Semantic Scholar with deduplication and 384-dimensional dense embeddings.",
  },
  {
    name: "2. Classifier",
    meaning:
      "Sorts papers into cohesive subfield clusters with descriptive theme labels and keyword tags, grouping papers for structured analysis.",
  },
  {
    name: "3. TCKG Builder",
    meaning:
      "Extracts scientific methods, problems, datasets, tasks, authors, and conceptual relationships into a Temporal Citation Knowledge Graph.",
  },
  {
    name: "4. Literature Review",
    meaning:
      "Synthesizes an academic review: introduction, cluster-by-cluster related work linking all constituent papers, research trends, and comparative matrix.",
  },
  {
    name: "5. Gap Detector",
    meaning:
      "Scores topic and citation sparsity across subfields using the explainable Research Gap Confidence Score (RGCS).",
  },
  {
    name: "6. Hypotheses Discovery",
    meaning:
      "Identifies cross-domain bridges between unaddressed problems and proven external methods using Graph-RAG and relation-aware link prediction.",
  },
];

const TABS_GUIDE = [
  {
    name: "Hypotheses Tab",
    meaning:
      "Actionable cross-domain scientific proposals. Each card displays candidate method, target problem, graph reasoning path, composite ranking score (0-100), and experimental validation recommendations.",
  },
  {
    name: "Knowledge Graph Tab (TCKG)",
    meaning:
      "Interactive 2D graph visualizer. Inspect methods, problems, papers, datasets, and authors. Filter by node types or slide the cutoff year to view chronological snapshots.",
  },
  {
    name: "Original Gaps (RGCS) Tab",
    meaning:
      "Baseline gap detection view showing candidate opportunities ranked by RGCS: Sparsity (40%), Recency (25%), Citation Trend (20%), and Model Novelty (15%).",
  },
  {
    name: "Literature Review Tab",
    meaning:
      "Complete structured academic survey. Includes Related Work cards showing the full list of constituent research papers for each cluster, cross-cluster trends, and side-by-side comparison matrix.",
  },
  {
    name: "Papers Tab",
    meaning:
      "Full table of all papers retrieved for the session, sortable by citations, publication year, subfield cluster, and external links.",
  },
];

const BENCHMARK_METRICS = [
  {
    name: "MRR (Mean Reciprocal Rank)",
    meaning:
      "Evaluates how close to rank #1 the first true emergent scientific link appears. Higher is better (1.0 = top rank).",
  },
  {
    name: "Precision@K & Recall@K",
    meaning:
      "Precision@5 measures how many of the top 5 predicted bridges emerged in actual peer-reviewed literature; Recall@K measures coverage of all emergent links.",
  },
  {
    name: "Hits@1 / 3 / 5 / 10",
    meaning:
      "Binary indicators of whether a ground-truth future breakthrough was retrieved within the top K positions.",
  },
];

function GuideSection({ icon: Icon, title, intro, rows }) {
  return (
    <section className="mt-8">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      </div>
      {intro && <p className="mt-2 text-xs text-slate-600 leading-relaxed">{intro}</p>}
      <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-xs">
        {rows.map((row) => (
          <div key={row.name} className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4 hover:bg-slate-50/60 transition">
            <p className="w-full shrink-0 font-bold text-slate-900 sm:w-48 text-xs">{row.name}</p>
            <p className="text-xs text-slate-600 leading-relaxed">{row.meaning}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ResultsGuidePage() {
  useDocumentTitle("Results Guide — ResearchMind");

  return (
    <div className="mx-auto max-w-3xl px-6 py-14 space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-brand-600">User Manual & Results Guide</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
          Understanding Your Investigation Results
        </h1>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          ResearchMind synthesizes large academic literature sets into interactive visual artifacts.
          Here is a step-by-step walkthrough of what each section represents, how metrics are computed,
          and how to interpret your findings.
        </p>
      </div>

      <GuideSection
        icon={Loader2}
        title="The 6-Agent Pipeline Execution"
        intro="As an investigation runs, 6 specialized autonomous agents execute in strict sequence:"
        rows={PIPELINE_STEPS}
      />

      <GuideSection
        icon={Layers}
        title="Investigation Results Tabs"
        intro="Once complete, results are organized into 5 dedicated exploration tabs:"
        rows={TABS_GUIDE}
      />

      <GuideSection
        icon={GitCompare}
        title="Historical Backtest Benchmark"
        intro="The backtesting module evaluates model rankings against real subsequent literature (e.g. training on <=2021 data, testing against 2022-2024 publications):"
        rows={BENCHMARK_METRICS}
      />

      <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-6 flex items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-brand-900 text-sm">Ready to explore the benchmark?</h4>
          <p className="text-xs text-brand-700 mt-1">
            View live ablation studies and quantitative ranking comparisons against baseline models.
          </p>
        </div>
        <Link
          to="/backtest"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition shrink-0"
        >
          View Benchmark <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
