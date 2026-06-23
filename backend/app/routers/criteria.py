from fastapi import APIRouter, HTTPException

from app.models.schemas import ParseCriteriaRequest, ParseCriteriaResponse
from app.services.criteria_parser import parse_criteria

router = APIRouter()


@router.post("/parse-criteria", response_model=ParseCriteriaResponse)
def parse_criteria_endpoint(request: ParseCriteriaRequest) -> ParseCriteriaResponse:
    try:
        return parse_criteria(request.protocol_text, request.trial_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to parse criteria: {exc}") from exc
