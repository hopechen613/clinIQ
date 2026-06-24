from concurrent.futures import ThreadPoolExecutor, as_completed

from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    ExtractProfileRequest,
    FindTrialsRequest,
    FindTrialsResponse,
    PatientProfile,
    TrialMatchResult,
)
from app.services.ctgov_client import search_trials
from app.services.patient_profile import extract_profile
from app.services.trial_matcher import assess_trial

router = APIRouter()

MAX_WORKERS = 5


@router.post("/patient/extract-profile", response_model=PatientProfile)
def extract_profile_endpoint(request: ExtractProfileRequest) -> PatientProfile:
    try:
        return extract_profile(request.patient_text)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to extract patient profile: {exc}") from exc


@router.post("/patient/find-trials", response_model=FindTrialsResponse)
def find_trials_endpoint(request: FindTrialsRequest) -> FindTrialsResponse:
    try:
        candidates = search_trials(
            condition=request.profile.condition_query,
            location=request.profile.location,
            max_results=request.max_results,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to search ClinicalTrials.gov: {exc}") from exc

    if not candidates:
        return FindTrialsResponse(profile=request.profile, candidates_found=0, results=[])

    results: list[TrialMatchResult] = [None] * len(candidates)  # type: ignore[list-item]
    with ThreadPoolExecutor(max_workers=min(MAX_WORKERS, len(candidates))) as pool:
        future_to_index = {
            pool.submit(assess_trial, request.profile, trial): i for i, trial in enumerate(candidates)
        }
        for future in as_completed(future_to_index):
            index = future_to_index[future]
            try:
                results[index] = future.result()
            except Exception:
                results[index] = None

    ranked = sorted((r for r in results if r is not None), key=lambda r: r.score, reverse=True)
    return FindTrialsResponse(profile=request.profile, candidates_found=len(candidates), results=ranked)
