import { Link } from "react-router-dom";
import { ChevronDown, HelpCircle, ArrowRight } from "lucide-react";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

const STEPS = [
  {
    title: "1. Enter a research topic & optional cutoff year",
    description:
      "Type any academic topic (e.g. \"Agentic AI in healthcare\" or \"crime prediction\"). Optionally provide a historical cutoff year (e.g. 2021) to run a strict retrospective investigation with zero data leakage.",
  },
  {
    title: "2. Watch the 6-agent pipeline execute",
    description:
      "Six specialized agents run in sequence: Paper Finder (OpenAlex/arXiv), Classifier (Themes), TCKG Builder (Knowledge Graph), Literature Review Writer, Gap Detector (RGCS), and Hypothesis Discovery (Graph-RAG). Typical runs complete in 45–75 seconds.",
  },
  {
    title: "3. Explore cross-domain hypotheses & knowledge graph",
    description:
      "Inspect grounded hypotheses with reasoning paths, explore the interactive 2D heterogeneous Knowledge Graph (TCKG), review cluster-by-cluster constituent papers, and export comprehensive JSON or Markdown reports.",
  },
];

const FAQS = [
  {
    q: "Where do the research papers come from?",
    a: "ResearchMind conducts federated live searches across OpenAlex (over 250 million open academic works), arXiv's primary Atom API (computer science, physics, math), and Semantic Scholar. All results are deduplicated and embedded on the fly.",
  },
  {
    q: "How does the Temporal Citation Knowledge Graph (TCKG) work?",
    a: "TCKG extracts entities (Methods, Research Problems, Datasets, Tasks, Authors, Concepts) and connects them through typed relationships with publication timestamps. This prevents temporal data leakage and enables multi-hop Graph-RAG reasoning.",
  },
  {
    q: "What is the difference between Hypotheses and Original Gaps (RGCS)?",
    a: "Original Gaps evaluate topic and citation sparsity using a baseline 4-part formula. Hypotheses (Agent 6) take this further by finding concrete cross-domain bridges between unaddressed problems in one field and proven computational methods from another, ranked via relation-aware link prediction.",
  },
  {
    q: "What does the Historical Backtesting Benchmark prove?",
    a: "The backtest proves that ResearchMind can predict connections that actually happen in science. By training strictly on literature published on or before 2021 and testing against what was subsequently published in 2022–2024, we measure MRR, Precision@K, and Hits@K to validate predictive link affinity.",
  },
  {
    q: "Can I export reports for my own writing or literature reviews?",
    a: "Yes! On any completed session page, click 'Export Findings' at the top right to download a comprehensive structured JSON dossier or clean Markdown summary suitable for citation or research proposals.",
  },
  {
    q: "What if the backend takes longer on the first search?",
    a: "Render cloud web services hibernate after prolonged idle time. If you start a search after inactivity, Render will take 30–45 seconds to spin up. Once warm, requests and agent steps execute rapidly.",
  },
];

export default function HelpPage() {
  useDocumentTitle("Help & Documentation — ResearchMind");

  return (
    <div className="mx-auto max-w-3xl px-6 py-14 space-y-10">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Documentation & Support</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
          How to Use ResearchMind
        </h1>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          Frequently asked questions, workflow instructions, and tips for getting the most out of your
          multi-agent research investigations.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Workflow Steps</h2>
        <ol className="space-y-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
                {i + 1}
              </span>
              <div>
                <p className="font-bold text-slate-900 text-sm">{step.title}</p>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          {FAQS.map((faq) => (
            <details key={faq.q} className="group p-5 hover:bg-slate-50/50 transition">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-slate-900 text-sm">
                {faq.q}
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">Ready to start an investigation?</h4>
          <p className="text-xs text-slate-500 mt-0.5">Explore any scientific topic across 250M+ research papers.</p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition"
        >
          New Investigation <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
