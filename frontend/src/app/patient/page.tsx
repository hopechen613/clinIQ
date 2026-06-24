"use client";

import { useState } from "react";
import Link from "next/link";
import { findTrials } from "@/lib/api";
import { DEFAULT_TRIAL_SEARCH_FILTERS, type FindTrialsResponse, type TrialSearchFilters } from "@/lib/types";
import StepIndicator from "@/components/StepIndicator";
import SearchFiltersStep from "@/components/patient/SearchFiltersStep";
import TrialResultsStep from "@/components/patient/TrialResultsStep";

const STEPS = ["Search", "Trials"];

export default function PatientPage() {
  const [step, setStep] = useState(0);
  const [filters, setFilters] = useState<TrialSearchFilters>(DEFAULT_TRIAL_SEARCH_FILTERS);
  const [results, setResults] = useState<FindTrialsResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    setLoading(true);
    setError(null);
    try {
      const found = await findTrials(filters);
      setResults(found);
      setStep(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to search for trials");
    } finally {
      setLoading(false);
    }
  }

  function startOver() {
    setStep(0);
    setFilters(DEFAULT_TRIAL_SEARCH_FILTERS);
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
            <SearchFiltersStep
              filters={filters}
              onFiltersChange={setFilters}
              onSubmit={handleSearch}
              loading={loading}
              error={error}
            />
          )}
          {step === 1 && results && (
            <TrialResultsStep data={results} onBack={() => setStep(0)} onStartOver={startOver} />
          )}
        </div>
      </main>
    </div>
  );
}
