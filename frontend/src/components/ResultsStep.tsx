"use client";

import { useState } from "react";
import type { Eligibility, MatchPatientsResponse } from "@/lib/types";

const ELIGIBILITY_STYLES: Record<Eligibility, string> = {
  eligible: "bg-emerald-100 text-emerald-800",
  ineligible: "bg-rose-100 text-rose-800",
  needs_review: "bg-amber-100 text-amber-800",
};

const ELIGIBILITY_LABELS: Record<Eligibility, string> = {
  eligible: "Eligible",
  ineligible: "Ineligible",
  needs_review: "Needs review",
};

const STATUS_STYLES: Record<string, string> = {
  met: "text-emerald-700",
  not_met: "text-rose-700",
  unclear: "text-amber-700",
};

export default function ResultsStep({
  results,
  onBack,
  onStartOver,
}: {
  results: MatchPatientsResponse;
  onBack: () => void;
  onStartOver: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const sorted = [...results.results].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Match results</h2>
        <p className="mt-1 text-sm text-slate-500">
          Ranked by overall fit score. Click a patient to see the criterion-by-criterion
          assessment and supporting evidence.
        </p>
      </div>

      <div className="space-y-3">
        {sorted.map((r) => {
          const isOpen = expanded === r.patient_id;
          return (
            <div key={r.patient_id} className="rounded-lg border border-slate-200">
              <button
                onClick={() => setExpanded(isOpen ? null : r.patient_id)}
                className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ELIGIBILITY_STYLES[r.eligibility]}`}
                  >
                    {ELIGIBILITY_LABELS[r.eligibility]}
                  </span>
                  <span className="font-medium text-slate-800">{r.patient_id}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-700">
                    {Math.round(r.score)}/100
                  </span>
                  <span className="text-slate-400">{isOpen ? "−" : "+"}</span>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-slate-200 px-4 py-3">
                  <p className="mb-3 text-sm text-slate-600">{r.summary}</p>
                  <ul className="space-y-2">
                    {r.criterion_assessments.map((a) => (
                      <li key={a.criterion_id} className="rounded-md bg-slate-50 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-slate-500">
                            {a.type === "inclusion" ? "Inclusion" : "Exclusion"}
                          </span>
                          <span className={`text-xs font-semibold uppercase ${STATUS_STYLES[a.status]}`}>
                            {a.status.replace("_", " ")} · {Math.round(a.confidence * 100)}%
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-700">{a.description}</p>
                        <p className="mt-1 text-xs italic text-slate-500">{a.evidence}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          Back
        </button>
        <button
          onClick={onStartOver}
          className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Start a new trial
        </button>
      </div>
    </div>
  );
}
