import { useState } from "react";
import { Download, FileText, FileSpreadsheet, Code, X } from "lucide-react";
import { exportSessionReport } from "../api/researchApi.js";

export default function ExportModal({ sessionId, isOpen, onClose }) {
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  async function handleDownload(format) {
    try {
      setDownloading(true);
      const data = await exportSessionReport(sessionId, format);

      let blob;
      let filename;
      if (format === "csv") {
        blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
        filename = `researchmind_hypotheses_${sessionId}.csv`;
      } else if (format === "markdown") {
        blob = new Blob([data], { type: "text/markdown;charset=utf-8;" });
        filename = `researchmind_report_${sessionId}.md`;
      } else {
        blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json;charset=utf-8;",
        });
        filename = `researchmind_session_${sessionId}.json`;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      setDownloading(false);
      onClose();
    } catch (err) {
      alert(`Export failed: ${err.message}`);
      setDownloading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Download className="h-4 w-4 text-brand-600" />
            Export Research Session
          </h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Select your preferred export format for citations, graph evidence, and ranked hypotheses:
        </p>

        <div className="mt-4 space-y-2.5">
          <button
            onClick={() => handleDownload("markdown")}
            disabled={downloading}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-left transition hover:border-brand-500 hover:bg-brand-50/30"
          >
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-indigo-600" />
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  Formatted Markdown Report (.md)
                </div>
                <div className="text-[11px] text-slate-500">
                  Academic report with formal hypothesis statements and evidence quotes.
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleDownload("csv")}
            disabled={downloading}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-left transition hover:border-brand-500 hover:bg-brand-50/30"
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  Spreadsheet Data Table (.csv)
                </div>
                <div className="text-[11px] text-slate-500">
                  Structured table with composite scores, RGCS scores, and method-problem pairs.
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleDownload("json")}
            disabled={downloading}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-left transition hover:border-brand-500 hover:bg-brand-50/30"
          >
            <div className="flex items-center gap-3">
              <Code className="h-5 w-5 text-amber-600" />
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  Full Session JSON Data (.json)
                </div>
                <div className="text-[11px] text-slate-500">
                  Complete machine-readable JSON including knowledge graph and provenance metadata.
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
