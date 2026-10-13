import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  HelpCircle,
  Download,
  Layers,
  Sparkles,
  BookOpen,
  FileText,
  Search,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useResearchSession } from "../hooks/useResearchSession.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { fetchHypotheses, retryResearchSession } from "../api/researchApi.js";
import PipelineProgress from "../components/PipelineProgress.jsx";
import PaperList from "../components/PaperList.jsx";
import LiteratureReview from "../components/LiteratureReview.jsx";
import GapCard from "../components/GapCard.jsx";
import HypothesisCard from "../components/HypothesisCard.jsx";
import KnowledgeGraphExplorer from "../components/KnowledgeGraphExplorer.jsx";
import ExportModal from "../components/ExportModal.jsx";

const TABS = [
  "Hypotheses",
  "Knowledge Graph",
  "Original Gaps (RGCS)",
  "Literature Review",
  "Papers",
];

export default function SessionPage() {
  const { id } = useParams();
  const { session, papers, error, isReconnecting, refetch } = useResearchSession(id);
  const [activeTab, setActiveTab] = useState("Hypotheses");
  const [hypotheses, setHypotheses] = useState([]);
  const [loadingHypotheses, setLoadingHypotheses] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useDocumentTitle(session ? `${session.topic} — ResearchMind` : "ResearchMind");

  // Fetch candidate hypotheses when session is ready
  useEffect(() => {
    let mounted = true;
    if (session?.status === "completed") {
      setLoadingHypotheses(true);
      fetchHypotheses(id)
        .then((data) => {
          if (mounted) {
            setHypotheses(data);
            setLoadingHypotheses(false);
          }
        })
        .catch(() => {
          if (mounted) setLoadingHypotheses(false);
        });
    }
    return () => {
      mounted = false;
    };
  }, [id, session?.status]);

  if (error && !session) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <div className="rounded-2xl border border-red-200 bg-red-50/70 p-8 shadow-sm">
          <h2 className="text-lg font-bold text-red-800">Session unavailable</h2>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <p className="mt-1 text-xs text-slate-500">
            If this session was recently created, the backend agents might still be running.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={refetch}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry Connection
            </button>
            <Link
              to="/"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center px-6 py-24 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="mt-3 text-sm font-medium">Connecting to research session...</p>
      </div>
    );
  }

  const isDone = session.status === "completed";
  const isFailed = session.status === "failed";

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Session Title Header and Actions */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              Research Investigation
            </span>
            {session.historicalCutoffYear && (
              <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
                Cutoff: &le; {session.historicalCutoffYear}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{session.topic}</h1>
          {session.paperCount > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              {session.paperCount} academic papers &middot; {session.clusters?.length || 0} subfield clusters &middot;{" "}
              {session.graphStats?.nodeCount || 0} graph entities &middot; {hypotheses.length || session.gaps?.length || 0} candidate opportunities
            </p>
          )}
        </div>

        {isDone && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExportOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
            >
              <Download className="h-3.5 w-3.5 text-brand-600" /> Export Findings
            </button>
          </div>
        )}
      </div>

      {/* Live Reconnecting and Active Pipeline Banners */}
      {isReconnecting && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 shadow-sm">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
            <span>Connection slow or server busy... Pipeline is actively running in background.</span>
          </div>
          <button onClick={refetch} className="font-semibold underline hover:text-amber-950">
            Refresh
          </button>
        </div>
      )}

      {!isDone && !isFailed && (
        <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 shadow-xs">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand-600" />
          <span>
            <strong>AI Agents Active:</strong> 6 specialized agents are searching arXiv/Semantic Scholar, clustering themes, extracting entities into a Temporal Citation Knowledge Graph, and discovering cross-domain hypotheses (typical duration: 60–90 seconds).
          </span>
        </div>
      )}

      {/* Live Pipeline Progression */}
      <div className="mb-8">
        <PipelineProgress steps={session.steps} />
      </div>

      {isFailed && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-red-800">Pipeline encountered an issue</p>
            <p className="mt-0.5 text-xs text-red-600">{session.errorMessage}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  setIsRetrying(true);
                  await retryResearchSession(session._id);
                  refetch();
                } catch (e) {
                  console.error(e);
                } finally {
                  setIsRetrying(false);
                }
              }}
              disabled={isRetrying}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-red-700 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} />
              {isRetrying ? "Restarting..." : "Retry Investigation"}
            </button>
            <Link
              to="/"
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              New Search
            </Link>
          </div>
        </div>
      )}

      {isDone && (
        <>
          {/* Navigation Tabs */}
          <div className="mb-6 flex flex-wrap items-center justify-between border-b border-slate-200">
            <div className="flex flex-wrap gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-semibold transition ${
                    activeTab === tab
                      ? "border-b-2 border-brand-600 text-brand-700"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <Link
              to="/guide"
              className="mb-2 flex items-center gap-1 text-xs text-slate-400 hover:text-brand-600"
            >
              <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Methodology Guide
            </Link>
          </div>

          {/* TAB 1: Ranked Candidate Hypotheses */}
          {activeTab === "Hypotheses" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50/70 p-3.5 border border-blue-200 text-xs text-blue-900 leading-relaxed">
                <span className="font-semibold">Candidate Hypotheses: </span>
                Cross-domain opportunities synthesized by bridging methods from one domain to unaddressed
                problems in another, grounded in multi-hop Graph-RAG evidence with transparent composite scores
                displayed alongside the original RGCS.
              </div>

              {loadingHypotheses ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Retrieving ranked candidate hypotheses...
                </div>
              ) : hypotheses.length > 0 ? (
                hypotheses.map((h) => <HypothesisCard key={h._id || h.title} hypothesis={h} />)
              ) : session.gaps?.length > 0 ? (
                session.gaps.map((gap) => <GapCard key={gap.title} gap={gap} />)
              ) : (
                <p className="text-sm text-slate-500">No candidate hypotheses were identified.</p>
              )}
            </div>
          )}

          {/* TAB 2: Knowledge Graph Explorer */}
          {activeTab === "Knowledge Graph" && (
            <KnowledgeGraphExplorer
              sessionId={id}
              defaultCutoff={session.historicalCutoffYear || null}
            />
          )}

          {/* TAB 3: Original Gaps (RGCS) */}
          {activeTab === "Original Gaps (RGCS)" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-100 p-3 text-xs text-slate-700">
                <span className="font-semibold">Original RGCS Baseline View: </span>
                Displays candidate gaps scored using the original formula:{" "}
                <code>0.40 &times; Sparsity + 0.25 &times; Recency + 0.20 &times; CitationTrend + 0.15 &times; LLMNovelty</code>.
              </div>
              {session.gaps?.length > 0 ? (
                session.gaps.map((gap) => <GapCard key={gap.title} gap={gap} />)
              ) : (
                <p className="text-sm text-slate-500">No candidate gaps were identified.</p>
              )}
            </div>
          )}

          {/* TAB 4: Literature Review */}
          {activeTab === "Literature Review" && (
            <LiteratureReview review={session.literatureReview} papers={papers} />
          )}

          {/* TAB 5: Papers */}
          {activeTab === "Papers" && <PaperList papers={papers} />}
        </>
      )}

      {/* Export Modal */}
      <ExportModal
        sessionId={id}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
}
