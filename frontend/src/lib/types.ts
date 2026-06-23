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
