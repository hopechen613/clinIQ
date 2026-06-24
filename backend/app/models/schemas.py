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


# --- Patient-facing trial search: ClinicalTrials.gov-style structured search ---


class TrialSearchFilters(BaseModel):
    # Basic search
    condition: Optional[str] = Field(None, description="Condition/disease, e.g. 'non-small cell lung cancer'")
    other_terms: Optional[str] = None
    intervention: Optional[str] = None
    location: Optional[str] = Field(None, description="Address, city, state, zip code, or country")
    title: Optional[str] = Field(None, description="Title and/or title acronym")
    additional_details: Optional[str] = Field(
        None, description="Optional free-text clinical detail to enrich AI explanations (not used for filtering)"
    )

    # Study status
    study_status: Literal["all", "recruiting_not_yet"] = "recruiting_not_yet"

    # Eligibility
    sex: Literal["all", "female", "male"] = "all"
    age_groups: List[Literal["child", "adult", "older_adult"]] = []
    age_min: Optional[int] = Field(None, ge=0, le=130)
    age_max: Optional[int] = Field(None, ge=0, le=130)
    accepts_healthy_volunteers: bool = False

    # Study design
    phases: List[Literal["early_phase1", "phase1", "phase2", "phase3", "phase4", "na"]] = []
    study_types: List[Literal["interventional", "observational", "patient_registries", "expanded_access"]] = []
    expanded_access_types: List[Literal["individual", "intermediate", "treatment"]] = []

    # Results & documents
    has_results: Optional[Literal["with", "without"]] = None
    study_documents: List[Literal["protocols", "saps", "icfs"]] = []

    # Funder
    funder_types: List[Literal["nih", "fed", "industry", "all_others"]] = []

    # Date ranges (mm/dd/yyyy, either side optional)
    study_start_from: Optional[str] = None
    study_start_to: Optional[str] = None
    primary_completion_from: Optional[str] = None
    primary_completion_to: Optional[str] = None
    first_posted_from: Optional[str] = None
    first_posted_to: Optional[str] = None
    results_first_posted_from: Optional[str] = None
    results_first_posted_to: Optional[str] = None
    last_update_posted_from: Optional[str] = None
    last_update_posted_to: Optional[str] = None
    study_completion_from: Optional[str] = None
    study_completion_to: Optional[str] = None


class FindTrialsRequest(BaseModel):
    filters: TrialSearchFilters
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
    filters: TrialSearchFilters
    candidates_found: int
    results: List[TrialMatchResult]
