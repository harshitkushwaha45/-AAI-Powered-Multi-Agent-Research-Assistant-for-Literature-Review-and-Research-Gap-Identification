import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BookOpen,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Quote,
} from "lucide-react";

function Prose({ children }) {
  return (
    <div className="prose-review prose prose-slate max-w-none prose-p:leading-relaxed text-sm text-slate-700">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}

function normalize(str) {
  return (str || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export default function LiteratureReview({ review, papers = [] }) {
  const [expandedAbstracts, setExpandedAbstracts] = useState({});
  const [expandedClusters, setExpandedClusters] = useState({});

  if (!review || !review.introduction) {
    return <p className="text-sm text-slate-500">Literature review not generated yet.</p>;
  }

  const toggleAbstract = (id) => {
    setExpandedAbstracts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCluster = (clusterName) => {
    setExpandedClusters((prev) => ({ ...prev, [clusterName]: !prev[clusterName] }));
  };

  // Build a lookup map from comparisonTable for quick access to key contributions
  const contributionMap = new Map();
  if (Array.isArray(review.comparisonTable)) {
    for (const row of review.comparisonTable) {
      if (row.title) contributionMap.set(normalize(row.title), row.keyContribution);
      if (row.paperId) contributionMap.set(row.paperId, row.keyContribution);
    }
  }

  // Helper to match papers to each cluster
  const getPapersForCluster = (clusterName, fallbackCount = 6) => {
    const normTarget = normalize(clusterName);

    // 1. Exact or partial cluster match
    let matched = papers.filter((p) => {
      const pNorm = normalize(p.cluster);
      return pNorm === normTarget || pNorm.includes(normTarget) || normTarget.includes(pNorm);
    });

    // 2. Fallback using comparisonTable cluster mappings
    if (matched.length === 0 && Array.isArray(review.comparisonTable)) {
      const matchedTitles = new Set(
        review.comparisonTable
          .filter((row) => {
            const rNorm = normalize(row.cluster);
            return rNorm === normTarget || rNorm.includes(normTarget) || normTarget.includes(rNorm);
          })
          .map((row) => normalize(row.title))
      );

      matched = papers.filter((p) => matchedTitles.has(normalize(p.title)));
    }

    // 3. Fallback: distribute evenly among clusters if clusters were generic
    if (matched.length === 0 && papers.length > 0) {
      const clusterIndex = review.relatedWork?.findIndex((r) => r.cluster === clusterName) || 0;
      const chunkSize = Math.max(1, Math.floor(papers.length / (review.relatedWork?.length || 1)));
      const start = clusterIndex * chunkSize;
      matched = papers.slice(start, start + chunkSize);
    }

    return matched;
  };

  return (
    <div className="space-y-10">
      {/* 1. Introduction */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="mb-3 text-lg font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-brand-600" />
          Introduction & Thematic Scope
        </h3>
        <Prose>{review.introduction}</Prose>
      </section>

      {/* 2. Related Work by Thematic Clusters (Shows papers for ALL topics!) */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-5 w-5 text-brand-600" />
              Related Work & Thematic Clusters
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Structured synthesis of clustered research themes and their constituent academic papers.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {review.relatedWork?.map((rw, clusterIdx) => {
            const clusterPapers = getPapersForCluster(rw.cluster, rw.paperCount || 6);
            const isCollapsed = expandedClusters[rw.cluster] === false;

            return (
              <div
                key={rw.cluster || clusterIdx}
                className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden transition-all"
              >
                {/* Cluster Header */}
                <div className="border-b border-slate-100 bg-slate-50/70 p-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white shadow-xs">
                      {clusterIdx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{rw.cluster}</h4>
                      <p className="text-xs text-slate-500">
                        {clusterPapers.length || rw.paperCount || 0} peer-reviewed research papers in this cluster
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-brand-50 border border-brand-200 px-3 py-0.5 text-xs font-bold text-brand-700">
                      {clusterPapers.length || rw.paperCount || 0} papers
                    </span>
                    <button
                      onClick={() => toggleCluster(rw.cluster)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
                      title={isCollapsed ? "Expand cluster" : "Collapse cluster"}
                    >
                      {isCollapsed ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="p-6 space-y-6">
                    {/* Thematic Synthesis Summary */}
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Cluster Synthesis & Methodological Focus
                      </h5>
                      <Prose>{rw.summary}</Prose>
                    </div>

                    {/* Constituent Papers List (Requested by User for ALL topics) */}
                    <div className="pt-4 border-t border-slate-100">
                      <div className="mb-3 flex items-center justify-between">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" />
                          Papers in this Cluster ({clusterPapers.length})
                        </h5>
                        <span className="text-[11px] text-slate-400">
                          Click paper titles for source links
                        </span>
                      </div>

                      {clusterPapers.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          Papers categorized under this cluster will appear here once loaded.
                        </p>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {clusterPapers.map((paper, pIdx) => {
                            const isAbsOpen = expandedAbstracts[paper.externalId || paper._id];
                            const keyCont =
                              contributionMap.get(normalize(paper.title)) ||
                              contributionMap.get(paper.externalId);

                            return (
                              <div
                                key={paper.externalId || paper._id || pIdx}
                                className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 hover:border-brand-300 hover:bg-white hover:shadow-xs transition"
                              >
                                <div>
                                  {/* Badges row */}
                                  <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                                    <span className="rounded bg-brand-100 px-1.5 py-0.5 font-bold text-brand-700">
                                      #{pIdx + 1}
                                    </span>
                                    {paper.year && (
                                      <span className="rounded bg-slate-200 px-1.5 py-0.5 font-medium text-slate-700">
                                        {paper.year}
                                      </span>
                                    )}
                                    <span className="rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-800">
                                      {paper.citationCount || 0} citations
                                    </span>
                                    <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-medium text-indigo-700 capitalize">
                                      {paper.source || "Academic"}
                                    </span>
                                  </div>

                                  {/* Title with link */}
                                  <h6 className="font-semibold text-slate-900 text-sm leading-snug group-hover:text-brand-700 transition">
                                    {paper.url ? (
                                      <a
                                        href={paper.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-baseline gap-1 hover:underline"
                                      >
                                        <span>{paper.title}</span>
                                        <ExternalLink className="h-3 w-3 inline text-slate-400 shrink-0" />
                                      </a>
                                    ) : (
                                      paper.title
                                    )}
                                  </h6>

                                  {/* Authors */}
                                  {Array.isArray(paper.authors) && paper.authors.length > 0 && (
                                    <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                                      {paper.authors.slice(0, 3).join(", ")}
                                      {paper.authors.length > 3 ? " et al." : ""}
                                    </p>
                                  )}

                                  {/* Key contribution excerpt */}
                                  {keyCont && (
                                    <div className="mt-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/60 p-2 text-xs text-emerald-900 flex items-start gap-1.5">
                                      <Quote className="h-3 w-3 shrink-0 text-emerald-600 mt-0.5" />
                                      <span className="line-clamp-2">{keyCont}</span>
                                    </div>
                                  )}

                                  {/* Abstract excerpt */}
                                  {paper.abstract && (
                                    <div className="mt-2 text-xs text-slate-600 leading-relaxed">
                                      <p className={isAbsOpen ? "" : "line-clamp-2"}>
                                        {paper.abstract}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Abstract toggle */}
                                {paper.abstract && paper.abstract.length > 140 && (
                                  <button
                                    onClick={() => toggleAbstract(paper.externalId || paper._id)}
                                    className="mt-3 text-left text-[11px] font-semibold text-brand-600 hover:text-brand-800"
                                  >
                                    {isAbsOpen ? "Show Less" : "Read Full Abstract"}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Research Trends */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="mb-3 text-lg font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-600" />
          Emerging Cross-Cluster Research Trends
        </h3>
        <Prose>{review.trends}</Prose>
      </section>

      {/* 4. Cross-Paper Comparison Matrix */}
      <section>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-900">
            Cross-Paper Methodological Comparison Matrix
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Side-by-side analysis of key methodologies, clusters, and citations across all papers.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Research Paper</th>
                <th className="px-4 py-3.5">Year</th>
                <th className="px-4 py-3.5">Subfield Cluster</th>
                <th className="px-4 py-3.5">Citations</th>
                <th className="px-5 py-3.5">Key Contribution / Novelty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {review.comparisonTable?.map((row, idx) => (
                <tr key={row.paperId || idx} className="hover:bg-slate-50/70 transition">
                  <td className="max-w-xs px-5 py-3.5 font-medium text-slate-900 text-xs">
                    {row.title}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 text-xs">{row.year || "—"}</td>
                  <td className="px-4 py-3.5 text-xs">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                      {row.cluster}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 font-semibold text-xs">
                    {row.citationCount ?? 0}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 text-xs leading-relaxed max-w-sm">
                    {row.keyContribution}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
