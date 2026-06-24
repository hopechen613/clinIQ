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

// --- Patient-facing trial search (mirrors trialgpt.app) ---

export type TrialEligibility =
  | "likely_eligible"
  | "possibly_eligible"
  | "likely_ineligible"
  | "insufficient_info";

export interface PatientProfile {
  condition_query: string;
  location?: string | null;
  age?: number | null;
  sex?: "male" | "female" | "unspecified" | null;
  summary: string;
}

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
  profile: PatientProfile;
  candidates_found: number;
  results: TrialMatchResult[];
}
