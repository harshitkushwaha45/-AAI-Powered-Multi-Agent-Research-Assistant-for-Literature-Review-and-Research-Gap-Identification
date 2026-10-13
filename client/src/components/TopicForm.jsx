import { useState } from "react";
import { Search, Loader2, Calendar } from "lucide-react";

const EXAMPLE_TOPICS = [
  "Agentic AI in healthcare",
  "Retrieval-augmented generation for scientific literature",
  "Multi-agent LLM coordination",
  "Graph Neural Networks for drug discovery",
];

export default function TopicForm({ onSubmit, submitting }) {
  const [topic, setTopic] = useState("");
  const [cutoffYear, setCutoffYear] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (topic.trim().length < 3) return;
    onSubmit(topic.trim(), cutoffYear ? Number(cutoffYear) : undefined);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
        <div className="flex flex-1 items-center gap-2">
          <Search className="ml-2 h-5 w-5 text-slate-400 shrink-0" />
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Retrieval-augmented generation for scientific literature"
            className="w-full border-none bg-transparent px-1 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            disabled={submitting}
          />
        </div>

        {/* Optional Temporal Cutoff Selector */}
        <div className="flex items-center gap-1.5 border-t sm:border-t-0 sm:border-l border-slate-200 px-2 py-1">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={cutoffYear}
            onChange={(e) => setCutoffYear(e.target.value)}
            className="bg-transparent text-xs text-slate-700 outline-none cursor-pointer"
            disabled={submitting}
            title="Temporal Cutoff Year for Historical Backtesting"
          >
            <option value="">Full Literature (Current)</option>
            <option value="2021">&le; 2021 (Backtest Cutoff)</option>
            <option value="2020">&le; 2020 (Backtest Cutoff)</option>
            <option value="2019">&le; 2019 (Historical)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting || topic.trim().length < 3}
          className="flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-2 font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 text-sm"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-medium">Examples:</span>
        {EXAMPLE_TOPICS.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setTopic(example)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-brand-300 hover:text-brand-700 transition"
          >
            {example}
          </button>
        ))}
      </div>
    </form>
  );
}
