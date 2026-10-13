"""
FastAPI Microservice for Relation-Aware Graph Learning and Historical Evaluation.
Exposes REST endpoints for online link scoring and backtesting execution.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional

from train_and_evaluate import run_full_evaluation

app = FastAPI(
    title="ResearchMind ML Service",
    description="PyTorch R-GCN & Relation-Aware Graph Learning API for ResearchMind",
    version="1.0.0"
)


class EvaluationRequest(BaseModel):
    graph: Dict[str, Any]
    cutoff_year: int = 2021
    eval_end_year: int = 2024


@app.get("/health")
def health():
    return {"status": "ok", "service": "ResearchMind ML Service", "device": "cpu"}


@app.post("/evaluate")
def evaluate(req: EvaluationRequest):
    try:
        results = run_full_evaluation(
            raw_graph=req.graph,
            cutoff_year=req.cutoff_year,
            eval_end_year=req.eval_end_year
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
