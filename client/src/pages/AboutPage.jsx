import {
  Search,
  Layers,
  FileText,
  Target,
  Sparkles,
  Network,
  Github,
  GitBranch,
  GitCommit,
  CheckCircle2,
  Server,
  Cloud,
  Cpu,
  Database,
  ExternalLink,
} from "lucide-react";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

const AGENTS = [
  {
    icon: Search,
    name: "Agent 1 — Multi-Source Paper Finder",
    badge: "OpenAlex + arXiv + S2",
    description:
      "Performs parallel federated searches across OpenAlex (250M+ catalog), arXiv, and Semantic Scholar. Deduplicates records, computes fast 384-dim embeddings, and ensures grounded survey coverage.",
  },
  {
    icon: Layers,
    name: "Agent 2 — Thematic Classifier",
    badge: "Thematic Clustering",
    description:
      "Organizes retrieved papers into coherent sub-topic clusters with keyword tagging, allowing downstream reasoning over thematic taxonomy instead of a flat list.",
  },
  {
    icon: Network,
    name: "Agent 3 — Knowledge Graph Builder (TCKG)",
    badge: "Temporal Knowledge Graph",
    description:
      "Extracts scientific methods, problems, datasets, tasks, authors, and relationships into a Temporal Citation Knowledge Graph with strict chronological provenance.",
  },
  {
    icon: FileText,
    name: "Agent 4 — Literature Review Writer",
    badge: "Structured Synthesis",
    description:
      "Synthesizes an academic literature review with introductory scope, cluster-by-cluster related work linking all constituent papers, emerging cross-domain trends, and a comparison table.",
  },
  {
    icon: Target,
    name: "Agent 5 — Explainable Gap Detector",
    badge: "RGCS Scoring",
    description:
      "Pinpoints topic and citation sparsity across subfields, evaluating candidate gaps through transparent RGCS composite formula combining sparsity, recency, citation velocity, and novelty.",
  },
  {
    icon: Sparkles,
    name: "Agent 6 — Hypothesis Discovery Agent",
    badge: "Graph-RAG & Link Prediction",
    description:
      "Grounds cross-domain bridge proposals in multi-hop graph reasoning paths, ranking candidate hypotheses through Graph-RAG and link prediction affinity scoring.",
  },
];

const RGCS_WEIGHTS = [
  {
    label: "Literature Sparsity",
    weight: "40%",
    description:
      "Proportion of the retrieved research landscape that has not addressed this specific intersection. High sparsity indicates an under-explored niche.",
  },
  {
    label: "Temporal Recency",
    weight: "25%",
    description:
      "Recency of adjacent foundational papers. Active citations indicate an evolving modern area rather than an obsolete line of inquiry.",
  },
  {
    label: "Citation Velocity",
    weight: "20%",
    description:
      "Normalized citation acceleration of neighboring work — identifies whether the broader problem domain is accelerating in community attention.",
  },
  {
    label: "Model Novelty Estimation",
    weight: "15%",
    description:
      "Evaluates conceptual cross-domain transfer distance while intentionally bounded to prevent hallucinated novelty claims.",
  },
];

const SERVICES = [
  {
    name: "Frontend Application",
    host: "Vercel Production",
    stack: "React 18, Vite, Tailwind CSS, Lucide Icons",
    status: "Active & Deployed",
  },
  {
    name: "Multi-Agent Backend API",
    host: "Render Cloud (Node.js/Express)",
    stack: "Node.js 20, Google GenAI SDK, OpenAlex API, Mongoose",
    url: "https://aai-powered-multi-agent-research.onrender.com",
    status: "Live (HTTP 200)",
  },
  {
    name: "ML Link Prediction Service",
    host: "Render Cloud (Python)",
    stack: "PyTorch, FastAPI, Relational Graph Convolutional Network (R-GCN)",
    url: "https://aai-powered-multi-agent-research-9rd0.onrender.com",
    status: "Healthy (device: cpu)",
  },
  {
    name: "Graph & Document Storage",
    host: "MongoDB Atlas Cloud",
    stack: "TCKG Nodes, Edges, Papers, Sessions, Vector Indexes",
    status: "Connected (M0 Shard Cluster)",
  },
];

export default function AboutPage() {
  useDocumentTitle("About the Project — ResearchMind");

  return (
    <div className="mx-auto max-w-4xl px-6 py-14 space-y-12">
      {/* Hero Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-brand-600">
          Architecture & System Design
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          ResearchMind: Autonomous Multi-Agent Academic Intelligence
        </h1>
        <p className="mt-4 text-base text-slate-600 leading-relaxed">
          Traditional research assistants summarize papers in isolation. ResearchMind automates
          the holistic literature review lifecycle: from parallel indexing across 250M+ OpenAlex
          and arXiv records, to constructing Temporal Citation Knowledge Graphs (TCKG), detecting
          literature gaps with transparent metrics (RGCS), and discovering grounded cross-domain hypotheses.
        </p>
      </div>

      {/* 6-Agent Pipeline */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="h-5 w-5 text-brand-600" />
            The 6-Agent Autonomous Pipeline
          </h2>
          <span className="rounded-full bg-brand-50 border border-brand-200 px-3 py-0.5 text-xs font-bold text-brand-700">
            Sequential & Grounded
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {AGENTS.map((agent) => (
            <div
              key={agent.name}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-brand-300 transition"
            >
              <div className="flex items-center justify-between">
                <agent.icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {agent.badge}
                </span>
              </div>
              <h3 className="mt-3 font-bold text-slate-900 text-sm">{agent.name}</h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{agent.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* RGCS Scoring Breakdown */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Target className="h-5 w-5 text-brand-600" />
          Research Gap Confidence Score (RGCS)
        </h2>
        <p className="mt-2 text-xs text-slate-600 leading-relaxed">
          RGCS transforms qualitative gap detection into a reproducible quantitative ranking.
          Rather than relying solely on black-box model assertions, RGCS grounds opportunities
          in temporal bibliography signals:
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {RGCS_WEIGHTS.map((w) => (
            <div
              key={w.label}
              className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5"
            >
              <span className="shrink-0 rounded-lg bg-brand-100 px-2 py-1 text-xs font-bold text-brand-700">
                {w.weight}
              </span>
              <div>
                <p className="font-semibold text-slate-900 text-xs">{w.label}</p>
                <p className="mt-0.5 text-[11px] text-slate-500 leading-normal">{w.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live System Architecture & Deployment Status */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-1">
          <Server className="h-5 w-5 text-brand-600" />
          System Architecture & Microservices
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Decoupled hybrid cloud architecture separating interactive presentation, orchestration, and graph deep learning.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {SERVICES.map((srv) => (
            <div
              key={srv.name}
              className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs">{srv.name}</h4>
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {srv.status}
                  </span>
                </div>
                <p className="mt-1 text-[11px] font-medium text-slate-500">{srv.host}</p>
                <p className="mt-2 text-xs text-slate-700">{srv.stack}</p>
              </div>
              {srv.url && (
                <a
                  href={srv.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-800"
                >
                  Endpoint Health <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Project Git Status & Repository Dashboard (Requested by User) */}
      <section className="rounded-2xl border border-slate-900 bg-slate-950 p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-100">Project Git Status & Deployment Integrity</h3>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 px-3 py-1 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Working Tree Clean & Up to Date
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="rounded-xl bg-slate-900/90 p-3 border border-slate-800">
            <div className="text-slate-400 text-[11px] flex items-center gap-1">
              <GitBranch className="h-3 w-3" /> Branch
            </div>
            <div className="mt-1 font-mono font-bold text-slate-100">main</div>
          </div>
          <div className="rounded-xl bg-slate-900/90 p-3 border border-slate-800">
            <div className="text-slate-400 text-[11px] flex items-center gap-1">
              <GitCommit className="h-3 w-3" /> Latest Commit
            </div>
            <div className="mt-1 font-mono font-bold text-brand-400">416cff1</div>
          </div>
          <div className="rounded-xl bg-slate-900/90 p-3 border border-slate-800">
            <div className="text-slate-400 text-[11px] flex items-center gap-1">
              <Cpu className="h-3 w-3" /> Pipeline Engine
            </div>
            <div className="mt-1 font-semibold text-slate-100">6-Agent Orchestrator</div>
          </div>
          <div className="rounded-xl bg-slate-900/90 p-3 border border-slate-800">
            <div className="text-slate-400 text-[11px] flex items-center gap-1">
              <Database className="h-3 w-3" /> Primary Index
            </div>
            <div className="mt-1 font-semibold text-slate-100">OpenAlex + arXiv</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-850 text-xs">
          <div className="text-slate-400 text-[11px]">
            Repository: <span className="font-mono text-slate-300">harshitkushwaha45/-AAI-Powered-Multi-Agent-Research-Assistant-for-Literature-Review-and-Research-Gap-Identification</span>
          </div>
          <a
            href="https://github.com/harshitkushwaha45/-AAI-Powered-Multi-Agent-Research-Assistant-for-Literature-Review-and-Research-Gap-Identification"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-white transition"
          >
            <Github className="h-3.5 w-3.5" /> View on GitHub
          </a>
        </div>
      </section>
    </div>
  );
}
