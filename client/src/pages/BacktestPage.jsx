import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import BacktestingDashboard from "../components/BacktestingDashboard.jsx";

export default function BacktestPage() {
  useDocumentTitle("Historical Backtesting & Ablation Benchmark — ResearchMind");

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <BacktestingDashboard />
    </div>
  );
}
