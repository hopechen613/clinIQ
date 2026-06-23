from concurrent.futures import ThreadPoolExecutor, as_completed

from fastapi import APIRouter, HTTPException

from app.models.schemas import MatchPatientsRequest, MatchPatientsResponse, PatientMatchResult
from app.services.patient_matcher import match_patient

router = APIRouter()

MAX_WORKERS = 5


@router.post("/match-patients", response_model=MatchPatientsResponse)
def match_patients_endpoint(request: MatchPatientsRequest) -> MatchPatientsResponse:
    if not request.patients:
        raise HTTPException(status_code=400, detail="No patients provided")

    results: list[PatientMatchResult] = [None] * len(request.patients)  # type: ignore[list-item]
    errors: list[str] = []

    with ThreadPoolExecutor(max_workers=min(MAX_WORKERS, len(request.patients))) as pool:
        future_to_index = {
            pool.submit(match_patient, request.criteria, patient): i
            for i, patient in enumerate(request.patients)
        }
        for future in as_completed(future_to_index):
            index = future_to_index[future]
            try:
                results[index] = future.result()
            except Exception as exc:
                errors.append(f"{request.patients[index].patient_id}: {exc}")

    if errors and all(r is None for r in results):
        raise HTTPException(status_code=502, detail=f"Failed to match patients: {'; '.join(errors)}")

    results = [r for r in results if r is not None]
    return MatchPatientsResponse(trial_id=request.criteria.trial_id, results=results)
