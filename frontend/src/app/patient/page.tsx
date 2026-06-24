"use client";

import { useState } from "react";
import Link from "next/link";
import { extractPatientProfile, findTrials } from "@/lib/api";
import type { FindTrialsResponse, PatientProfile } from "@/lib/types";
import StepIndicator from "@/components/StepIndicator";
import DescribeStep from "@/components/patient/DescribeStep";
import ProfileReviewStep from "@/components/patient/ProfileReviewStep";
import TrialResultsStep from "@/components/patient/TrialResultsStep";

const STEPS = ["Describe", "Review", "Trials"];

export default function PatientPage() {
  const [step, setStep] = useState(0);

  const [patientText, setPatientText] = useState("");
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [results, setResults] = useState<FindTrialsResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExtractProfile() {
    setLoading(true);
    setError(null);
    try {
      const extracted = await extractPatientProfile(patientText);
      setProfile(extracted);
      setStep(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read your description");
    } finally {
      setLoading(false);
    }
  }

  async function handleFindTrials() {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const found = await findTrials(profile);
      setResults(found);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to search for trials");
    } finally {
      setLoading(false);
    }
  }

  function startOver() {
    setStep(0);
    setPatientText("");
    setProfile(null);
    setResults(null);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Clin<span className="text-teal-600">IQ</span>{" "}
              <span className="text-sm font-normal text-slate-400">for patients</span>
            </h1>
            <p className="text-xs text-slate-500">Find clinical trials that may fit you</p>
          </div>
          <div className="flex items-center gap-4">
            <StepIndicator active={step} steps={STEPS} />
            <Link href="/" className="text-xs font-medium text-slate-400 hover:text-teal-600">
              Clinician view →
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {step === 0 && (
            <DescribeStep
              patientText={patientText}
              onPatientTextChange={setPatientText}
              onSubmit={handleExtractProfile}
              loading={loading}
              error={error}
            />
          )}
          {step === 1 && profile && (
            <ProfileReviewStep
              profile={profile}
              onProfileChange={setProfile}
              onBack={() => setStep(0)}
              onSubmit={handleFindTrials}
              loading={loading}
              error={error}
            />
          )}
          {step === 2 && results && (
            <TrialResultsStep data={results} onBack={() => setStep(1)} onStartOver={startOver} />
          )}
        </div>
      </main>
    </div>
  );
}
