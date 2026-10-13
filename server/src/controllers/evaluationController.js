import { EvaluationRun } from "../models/EvaluationRun.js";
import { BacktestingService } from "../services/backtestingService.js";

export async function runBacktestJob(req, res) {
  const { sessionId, cutoffYear, evalStartYear, evalEndYear } = req.body;

  const result = await BacktestingService.runBacktest({
    sessionId,
    cutoffYear: cutoffYear ? Number(cutoffYear) : 2021,
    evalStartYear: evalStartYear ? Number(evalStartYear) : 2022,
    evalEndYear: evalEndYear ? Number(evalEndYear) : 2024,
  });

  res.status(201).json(result);
}

export async function listEvaluationRuns(req, res) {
  const runs = await EvaluationRun.find()
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  res.json(runs);
}

export async function getLatestEvaluationRun(req, res) {
  let run = await EvaluationRun.findOne()
    .sort({ createdAt: -1 })
    .lean();

  // If no evaluation runs exist yet in the database, execute a run so the dashboard always has live verified data!
  if (!run) {
    run = await BacktestingService.runBacktest({
      cutoffYear: 2021,
      evalStartYear: 2022,
      evalEndYear: 2024,
    });
  }

  res.json(run);
}

export async function getEvaluationRun(req, res) {
  const run = await EvaluationRun.findById(req.params.id).lean();
  if (!run) return res.status(404).json({ error: "Evaluation run not found" });
  res.json(run);
}
