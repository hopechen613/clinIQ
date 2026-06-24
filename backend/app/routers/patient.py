from concurrent.futures import ThreadPoolExecutor, as_completed

from fastapi import APIRouter, HTTPException

from app.models.schemas import FindTrialsRequest, FindTrialsResponse, TrialMatchResult
from app.services.ctgov_client import search_trials
from app.services.trial_matcher import assess_trial

router = APIRouter()

MAX_WORKERS = 5


@router.post("/patient/find-trials", response_model=FindTrialsResponse)
def find_trials_endpoint(request: FindTrialsRequest) -> FindTrialsResponse:
    try:
        candidates = search_trials(request.filters, max_results=request.max_results)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to search ClinicalTrials.gov: {exc}") from exc

    if not candidates:
        return FindTrialsResponse(filters=request.filters, candidates_found=0, results=[])

    results: list[TrialMatchResult] = [None] * len(candidates)  # type: ignore[list-item]
    with ThreadPoolExecutor(max_workers=min(MAX_WORKERS, len(candidates))) as pool:
        future_to_index = {
            pool.submit(assess_trial, request.filters, trial): i for i, trial in enumerate(candidates)
        }
        for future in as_completed(future_to_index):
            index = future_to_index[future]
            try:
                results[index] = future.result()
            except Exception:
                results[index] = None

    ranked = sorted((r for r in results if r is not None), key=lambda r: r.score, reverse=True)
    return FindTrialsResponse(filters=request.filters, candidates_found=len(candidates), results=ranked)
