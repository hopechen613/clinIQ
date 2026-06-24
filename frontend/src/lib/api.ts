import type {
  FindTrialsResponse,
  MatchPatientsResponse,
  ParseCriteriaResponse,
  PatientProfile,
  PatientRecord,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.detail || `Request to ${path} failed (${res.status})`);
  }
  return res.json();
}

export function parseCriteria(protocolText: string, trialId?: string) {
  return postJSON<ParseCriteriaResponse>("/api/parse-criteria", {
    protocol_text: protocolText,
    trial_id: trialId || null,
  });
}

export function matchPatients(criteria: ParseCriteriaResponse, patients: PatientRecord[]) {
  return postJSON<MatchPatientsResponse>("/api/match-patients", {
    criteria,
    patients,
  });
}

export function extractPatientProfile(patientText: string) {
  return postJSON<PatientProfile>("/api/patient/extract-profile", {
    patient_text: patientText,
  });
}

export function findTrials(profile: PatientProfile, maxResults = 8) {
  return postJSON<FindTrialsResponse>("/api/patient/find-trials", {
    profile,
    max_results: maxResults,
  });
}
