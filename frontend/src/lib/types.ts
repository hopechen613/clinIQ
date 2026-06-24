export type CriterionType = "inclusion" | "exclusion";
export type AssessmentStatus = "met" | "not_met" | "unclear";
export type Eligibility = "eligible" | "ineligible" | "needs_review";

export interface StructuredCriterion {
  field?: string;
  operator?: string;
  value?: unknown;
  unit?: string | null;
}

export interface Criterion {
  id: string;
  type: CriterionType;
  category: string;
  description: string;
  structured?: StructuredCriterion | null;
}

export interface ParseCriteriaResponse {
  trial_id?: string | null;
  inclusion_criteria: Criterion[];
  exclusion_criteria: Criterion[];
  raw_model_output?: string | null;
}

export interface PatientRecord {
  patient_id: string;
  record_text: string;
}

export interface CriterionAssessment {
  criterion_id: string;
  description: string;
  type: CriterionType;
  status: AssessmentStatus;
  evidence: string;
  confidence: number;
}

export interface PatientMatchResult {
  patient_id: string;
  eligibility: Eligibility;
  score: number;
  summary: string;
  criterion_assessments: CriterionAssessment[];
}

export interface MatchPatientsResponse {
  trial_id?: string | null;
  results: PatientMatchResult[];
}

// --- Patient-facing trial search: ClinicalTrials.gov-style structured search ---

export type TrialEligibility =
  | "likely_eligible"
  | "possibly_eligible"
  | "likely_ineligible"
  | "insufficient_info";

export type AgeGroup = "child" | "adult" | "older_adult";
export type Phase = "early_phase1" | "phase1" | "phase2" | "phase3" | "phase4" | "na";
export type StudyType = "interventional" | "observational" | "patient_registries" | "expanded_access";
export type ExpandedAccessType = "individual" | "intermediate" | "treatment";
export type StudyDocument = "protocols" | "saps" | "icfs";
export type FunderType = "nih" | "fed" | "industry" | "all_others";

export interface TrialSearchFilters {
  condition?: string | null;
  other_terms?: string | null;
  intervention?: string | null;
  location?: string | null;
  title?: string | null;
  additional_details?: string | null;

  study_status: "all" | "recruiting_not_yet";

  sex: "all" | "female" | "male";
  age_groups: AgeGroup[];
  age_min?: number | null;
  age_max?: number | null;
  accepts_healthy_volunteers: boolean;

  phases: Phase[];
  study_types: StudyType[];
  expanded_access_types: ExpandedAccessType[];

  has_results?: "with" | "without" | null;
  study_documents: StudyDocument[];

  funder_types: FunderType[];

  study_start_from?: string | null;
  study_start_to?: string | null;
  primary_completion_from?: string | null;
  primary_completion_to?: string | null;
  first_posted_from?: string | null;
  first_posted_to?: string | null;
  results_first_posted_from?: string | null;
  results_first_posted_to?: string | null;
  last_update_posted_from?: string | null;
  last_update_posted_to?: string | null;
  study_completion_from?: string | null;
  study_completion_to?: string | null;
}

export const DEFAULT_TRIAL_SEARCH_FILTERS: TrialSearchFilters = {
  study_status: "recruiting_not_yet",
  sex: "all",
  age_groups: [],
  accepts_healthy_volunteers: false,
  phases: [],
  study_types: [],
  expanded_access_types: [],
  study_documents: [],
  funder_types: [],
};

export interface TrialKeyPoint {
  type: "supporting" | "conflicting" | "missing_info";
  text: string;
}

export interface TrialMatchResult {
  nct_id: string;
  title: string;
  status: string;
  phase?: string | null;
  locations: string[];
  url: string;
  eligibility: TrialEligibility;
  score: number;
  explanation: string;
  key_points: TrialKeyPoint[];
}

export interface FindTrialsResponse {
  filters: TrialSearchFilters;
  candidates_found: number;
  results: TrialMatchResult[];
}
