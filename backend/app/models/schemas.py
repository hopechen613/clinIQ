from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class ParseCriteriaRequest(BaseModel):
    protocol_text: str = Field(..., min_length=20, description="Raw trial protocol text")
    trial_id: Optional[str] = Field(None, description="Optional sponsor trial identifier")


class Criterion(BaseModel):
    id: str
    type: Literal["inclusion", "exclusion"]
    category: str = Field(..., description="e.g. demographics, diagnosis, lab_value, medication, prior_therapy")
    description: str
    structured: Optional[dict] = Field(
        None, description="Machine-readable form, e.g. {field: 'age', operator: '>=', value: 18, unit: 'years'}"
    )


class ParseCriteriaResponse(BaseModel):
    trial_id: Optional[str] = None
    inclusion_criteria: List[Criterion]
    exclusion_criteria: List[Criterion]
    raw_model_output: Optional[str] = None


class PatientRecord(BaseModel):
    patient_id: str
    record_text: str = Field(..., min_length=1, description="Raw patient record / EHR excerpt text")


class MatchPatientsRequest(BaseModel):
    criteria: ParseCriteriaResponse
    patients: List[PatientRecord]


class CriterionAssessment(BaseModel):
    criterion_id: str
    description: str
    type: Literal["inclusion", "exclusion"]
    status: Literal["met", "not_met", "unclear"]
    evidence: str
    confidence: float = Field(..., ge=0, le=1)


class PatientMatchResult(BaseModel):
    patient_id: str
    eligibility: Literal["eligible", "ineligible", "needs_review"]
    score: float = Field(..., ge=0, le=100, description="Overall match score out of 100")
    summary: str
    criterion_assessments: List[CriterionAssessment]


class MatchPatientsResponse(BaseModel):
    trial_id: Optional[str] = None
    results: List[PatientMatchResult]


# --- Patient-facing trial search (mirrors trialgpt.app) ---


class ExtractProfileRequest(BaseModel):
    patient_text: str = Field(
        ..., min_length=10, description="Patient's free-text description of their condition/situation"
    )


class PatientProfile(BaseModel):
    condition_query: str = Field(..., description="Concise condition/disease phrase for trial search, e.g. 'non-small cell lung cancer'")
    location: Optional[str] = Field(None, description="City/state/country the patient can travel to, if mentioned")
    age: Optional[int] = None
    sex: Optional[Literal["male", "female", "unspecified"]] = None
    summary: str = Field(..., description="Normalized clinical summary of the patient for eligibility matching")


class FindTrialsRequest(BaseModel):
    profile: PatientProfile
    max_results: int = Field(8, ge=1, le=20)


class TrialCandidate(BaseModel):
    nct_id: str
    title: str
    status: str
    phase: Optional[str] = None
    conditions: List[str] = []
    brief_summary: str
    eligibility_criteria: str
    sex: Optional[str] = None
    minimum_age: Optional[str] = None
    maximum_age: Optional[str] = None
    locations: List[str] = []
    url: str


class TrialKeyPoint(BaseModel):
    type: Literal["supporting", "conflicting", "missing_info"]
    text: str


class TrialMatchResult(BaseModel):
    nct_id: str
    title: str
    status: str
    phase: Optional[str] = None
    locations: List[str] = []
    url: str
    eligibility: Literal["likely_eligible", "possibly_eligible", "likely_ineligible", "insufficient_info"]
    score: float = Field(..., ge=0, le=100)
    explanation: str
    key_points: List[TrialKeyPoint]


class FindTrialsResponse(BaseModel):
    profile: PatientProfile
    candidates_found: int
    results: List[TrialMatchResult]
