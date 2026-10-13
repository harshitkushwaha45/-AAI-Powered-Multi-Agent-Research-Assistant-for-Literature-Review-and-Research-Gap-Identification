import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createResearchSession } from "../api/researchApi.js";
import TopicForm from "../components/TopicForm.jsx";
import RecentSessionsList from "../components/RecentSessionsList.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export default function HomePage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useDocumentTitle("ResearchMind — Multi-Agent AI for Literature Review & Research Gap Discovery");

  async function handleSubmit(topic, cutoffYear) {
    setSubmitting(true);
    setError(null);
    try {
      const { sessionId } = await createResearchSession(topic, cutoffYear);
      navigate(`/session/${sessionId}`);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center px-6 py-16">
      <h1 className="text-center text-4xl font-bold tracking-tight text-slate-900">
        AI-Powered Multi-Agent Research Assistant for Literature Review<br className="hidden sm:block" /> &amp; Research Gap Discovery
      </h1>
      <p className="mt-4 max-w-2xl text-center text-slate-500 text-sm leading-relaxed">
        Cooperating AI agents search real literature, construct a Temporal Citation Knowledge Graph,
        synthesize structured literature reviews, and rank cross-domain candidate hypotheses using
        Graph-RAG and link prediction &mdash; evaluated with an explainable composite score and historical backtesting.
      </p>

      <div className="mt-8">
        <TopicForm onSubmit={handleSubmit} submitting={submitting} />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <RecentSessionsList />
    </div>
  );
}
