"use client";

import type { PatientProfile } from "@/lib/types";

interface Props {
  profile: PatientProfile;
  onProfileChange: (profile: PatientProfile) => void;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}

export default function ProfileReviewStep({
  profile,
  onProfileChange,
  onBack,
  onSubmit,
  loading,
  error,
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Confirm your profile</h2>
        <p className="mt-1 text-sm text-slate-500">
          This is what we extracted from your description. Edit anything that looks wrong
          before we search for trials.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Condition (search term)
          </label>
          <input
            type="text"
            value={profile.condition_query}
            onChange={(e) => onProfileChange({ ...profile, condition_query: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Location <span className="text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            value={profile.location || ""}
            onChange={(e) => onProfileChange({ ...profile, location: e.target.value })}
            placeholder="City, state, or country"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Age <span className="text-slate-400">(optional)</span>
          </label>
          <input
            type="number"
            value={profile.age ?? ""}
            onChange={(e) =>
              onProfileChange({ ...profile, age: e.target.value ? Number(e.target.value) : null })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Sex <span className="text-slate-400">(optional)</span>
          </label>
          <select
            value={profile.sex || "unspecified"}
            onChange={(e) =>
              onProfileChange({ ...profile, sex: e.target.value as PatientProfile["sex"] })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="unspecified">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Clinical summary</label>
        <textarea
          value={profile.summary}
          onChange={(e) => onProfileChange({ ...profile, summary: e.target.value })}
          rows={5}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm leading-relaxed focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
        <p className="mt-1 text-xs text-slate-400">
          This is what gets compared against each trial&apos;s eligibility criteria.
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={loading || !profile.condition_query.trim() || !profile.summary.trim()}
          className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Searching ClinicalTrials.gov..." : "Find matching trials"}
        </button>
      </div>
    </div>
  );
}
