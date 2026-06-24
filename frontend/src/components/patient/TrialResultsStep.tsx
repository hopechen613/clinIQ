"use client";

import { useState } from "react";
import type { FindTrialsResponse, TrialEligibility } from "@/lib/types";

const ELIGIBILITY_STYLES: Record<TrialEligibility, string> = {
  likely_eligible: "bg-emerald-100 text-emerald-800",
  possibly_eligible: "bg-amber-100 text-amber-800",
  likely_ineligible: "bg-rose-100 text-rose-800",
  insufficient_info: "bg-slate-100 text-slate-600",
};

const ELIGIBILITY_LABELS: Record<TrialEligibility, string> = {
  likely_eligible: "Likely eligible",
  possibly_eligible: "Possibly eligible",
  likely_ineligible: "Likely not eligible",
  insufficient_info: "Not enough info",
};

const KEY_POINT_STYLES: Record<string, string> = {
  supporting: "text-emerald-700",
  conflicting: "text-rose-700",
  missing_info: "text-slate-500",
};

const KEY_POINT_PREFIX: Record<string, string> = {
  supporting: "✓",
  conflicting: "✗",
  missing_info: "?",
};

export default function TrialResultsStep({
  data,
  onBack,
  onStartOver,
}: {
  data: FindTrialsResponse;
  onBack: () => void;
  onStartOver: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Matching trials</h2>
        <p className="mt-1 text-sm text-slate-500">
          Found {data.candidates_found} matching trial{data.candidates_found === 1 ? "" : "s"} on
          ClinicalTrials.gov
          {data.filters.condition ? ` for "${data.filters.condition}"` : ""}
          {data.filters.location ? ` near ${data.filters.location}` : ""}, ranked by how well you
          might fit.
        </p>
      </div>

      {data.results.length === 0 ? (
        <p className="rounded-md bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          No recruiting trials found for this condition. Try broadening the condition or
          removing the location filter.
        </p>
      ) : (
        <div className="space-y-3">
          {data.results.map((r) => {
            const isOpen = expanded === r.nct_id;
            return (
              <div key={r.nct_id} className="rounded-lg border border-slate-200">
                <button
                  onClick={() => setExpanded(isOpen ? null : r.nct_id)}
                  className="flex w-full items-start justify-between gap-4 px-4 py-3 text-left"
                >
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ELIGIBILITY_STYLES[r.eligibility]}`}
                      >
                        {ELIGIBILITY_LABELS[r.eligibility]}
                      </span>
                      <span className="text-xs text-slate-400">{r.nct_id}</span>
                      {r.phase && <span className="text-xs text-slate-400">· {r.phase}</span>}
                    </div>
                    <p className="font-medium text-slate-800">{r.title}</p>
                    {r.locations.length > 0 && (
                      <p className="mt-0.5 text-xs text-slate-500">{r.locations.join(" · ")}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold text-slate-700">
                      {Math.round(r.score)}/100
                    </span>
                    <span className="text-slate-400">{isOpen ? "−" : "+"}</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-200 px-4 py-3">
                    <p className="mb-3 text-sm text-slate-600">{r.explanation}</p>
                    <ul className="mb-3 space-y-1.5">
                      {r.key_points.map((kp, i) => (
                        <li key={i} className={`text-sm ${KEY_POINT_STYLES[kp.type]}`}>
                          <span className="mr-1.5 font-semibold">{KEY_POINT_PREFIX[kp.type]}</span>
                          {kp.text}
                        </li>
                      ))}
                    </ul>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-teal-600 hover:underline"
                    >
                      View full trial details on ClinicalTrials.gov →
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-slate-400">
        Results are AI-generated from public ClinicalTrials.gov data and are not a substitute
        for medical advice. Discuss any trial with your care team before enrolling.
      </p>

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
          Start over
        </button>
      </div>
    </div>
  );
}
