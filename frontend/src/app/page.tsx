"use client";

import { useState } from "react";
import { matchPatients, parseCriteria } from "@/lib/api";
import type { MatchPatientsResponse, ParseCriteriaResponse, PatientRecord } from "@/lib/types";
import StepIndicator from "@/components/StepIndicator";
import ProtocolStep from "@/components/ProtocolStep";
import PatientStep from "@/components/PatientStep";
import ResultsStep from "@/components/ResultsStep";

export default function Home() {
  const [step, setStep] = useState(0);

  const [protocolText, setProtocolText] = useState("");
  const [trialId, setTrialId] = useState("");
  const [criteria, setCriteria] = useState<ParseCriteriaResponse | null>(null);

  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [results, setResults] = useState<MatchPatientsResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleParseCriteria() {
    setLoading(true);
    setError(null);
    try {
      const parsed = await parseCriteria(protocolText, trialId);
      setCriteria(parsed);
      setStep(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to extract criteria");
    } finally {
      setLoading(false);
    }
  }

  async function handleMatchPatients() {
    if (!criteria) return;
    setLoading(true);
    setError(null);
    try {
      const matched = await matchPatients(criteria, patients);
      setResults(matched);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to match patients");
    } finally {
      setLoading(false);
    }
  }

  function startOver() {
    setStep(0);
    setProtocolText("");
    setTrialId("");
    setCriteria(null);
    setPatients([]);
    setResults(null);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Clin<span className="text-teal-600">IQ</span>
            </h1>
            <p className="text-xs text-slate-500">AI-assisted clinical trial patient matching</p>
          </div>
          <StepIndicator active={step} />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {step === 0 && (
            <ProtocolStep
              protocolText={protocolText}
              trialId={trialId}
              onProtocolTextChange={setProtocolText}
              onTrialIdChange={setTrialId}
              onSubmit={handleParseCriteria}
              loading={loading}
              error={error}
            />
          )}
          {step === 1 && criteria && (
            <PatientStep
              criteria={criteria}
              patients={patients}
              onPatientsChange={setPatients}
              onBack={() => setStep(0)}
              onSubmit={handleMatchPatients}
              loading={loading}
              error={error}
            />
          )}
          {step === 2 && results && (
            <ResultsStep results={results} onBack={() => setStep(1)} onStartOver={startOver} />
          )}
        </div>
      </main>
    </div>
  );
}
