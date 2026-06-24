"use client";

import { useState } from "react";
import type {
  AgeGroup,
  ExpandedAccessType,
  FunderType,
  Phase,
  StudyDocument,
  StudyType,
  TrialSearchFilters,
} from "@/lib/types";

interface Props {
  filters: TrialSearchFilters;
  onFiltersChange: (filters: TrialSearchFilters) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}

function toggleInArray<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
      />
      {label}
    </label>
  );
}

function Radio({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 border-slate-300 text-teal-600 focus:ring-teal-500"
      />
      {label}
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  helper,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  helper?: string;
}) {
  const id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
      />
      {helper && <p className="mt-1 text-xs text-slate-400">{helper}</p>}
    </div>
  );
}

function DateField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="mm/dd/yyyy"
      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
    />
  );
}

function DateRangeRow({
  label,
  from,
  to,
  onFromChange,
  onToChange,
}: {
  label: string;
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}) {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <div>
      <p className="mb-1 text-sm font-medium text-slate-700">{label}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${slug}-from`} className="mb-0.5 block text-xs text-slate-500">
            From
          </label>
          <DateField id={`${slug}-from`} value={from} onChange={onFromChange} />
        </div>
        <div>
          <label htmlFor={`${slug}-to`} className="mb-0.5 block text-xs text-slate-500">
            To
          </label>
          <DateField id={`${slug}-to`} value={to} onChange={onToChange} />
        </div>
      </div>
    </div>
  );
}

const PHASE_OPTIONS: { value: Phase; label: string }[] = [
  { value: "early_phase1", label: "Early Phase 1" },
  { value: "phase1", label: "Phase 1" },
  { value: "phase2", label: "Phase 2" },
  { value: "phase3", label: "Phase 3" },
  { value: "phase4", label: "Phase 4" },
  { value: "na", label: "Not applicable" },
];

const EXPANDED_ACCESS_OPTIONS: { value: ExpandedAccessType; label: string }[] = [
  { value: "individual", label: "Individual patients" },
  { value: "intermediate", label: "Intermediate-size population" },
  { value: "treatment", label: "Treatment IND/Protocol" },
];

const DOCUMENT_OPTIONS: { value: StudyDocument; label: string }[] = [
  { value: "protocols", label: "Study protocols" },
  { value: "saps", label: "Statistical analysis plans (SAPs)" },
  { value: "icfs", label: "Informed consent forms (ICFs)" },
];

const FUNDER_OPTIONS: { value: FunderType; label: string }[] = [
  { value: "nih", label: "NIH" },
  { value: "fed", label: "Other U.S. federal agency" },
  { value: "industry", label: "Industry" },
  { value: "all_others", label: "All others (individuals, universities, organizations)" },
];

const AGE_GROUP_OPTIONS: { value: AgeGroup; label: string }[] = [
  { value: "child", label: "Child (birth - 17)" },
  { value: "adult", label: "Adult (18 - 64)" },
  { value: "older_adult", label: "Older adult (65+)" },
];

export default function SearchFiltersStep({
  filters,
  onFiltersChange,
  onSubmit,
  loading,
  error,
}: Props) {
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [showMoreWaysToSearch, setShowMoreWaysToSearch] = useState(false);
  const [ageMode, setAgeMode] = useState<"ranges" | "manual">(
    filters.age_min != null || filters.age_max != null ? "manual" : "ranges",
  );

  function set<K extends keyof TrialSearchFilters>(key: K, value: TrialSearchFilters[K]) {
    onFiltersChange({ ...filters, [key]: value });
  }

  const resultsWith = filters.has_results === "with";
  const resultsWithout = filters.has_results === "without";

  function toggleHasResults(which: "with" | "without") {
    const current = filters.has_results;
    if (which === "with") {
      set("has_results", current === "with" ? null : current === "without" ? null : "with");
    } else {
      set("has_results", current === "without" ? null : current === "with" ? null : "without");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Focus your search</h2>
        <p className="mt-1 text-sm text-slate-500">All filters optional &middot; Expert Search</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Condition/disease"
          value={filters.condition || ""}
          onChange={(v) => set("condition", v)}
        />
        <TextField
          label="Other terms"
          value={filters.other_terms || ""}
          onChange={(v) => set("other_terms", v)}
        />
        <TextField
          label="Intervention/treatment"
          value={filters.intervention || ""}
          onChange={(v) => set("intervention", v)}
        />
        <TextField
          label="Location"
          value={filters.location || ""}
          onChange={(v) => set("location", v)}
          helper="Search by address, city, state, zip code, or country. Trials worldwide are included, not just the United States."
        />
      </div>

      <div>
        <label htmlFor="additional-details" className="mb-1 block text-sm font-medium text-slate-700">
          Additional clinical details <span className="text-slate-400">(optional)</span>
        </label>
        <textarea
          id="additional-details"
          value={filters.additional_details || ""}
          onChange={(e) => set("additional_details", e.target.value)}
          rows={3}
          placeholder="Prior treatments, lab values, or anything else that might help us explain trial fit more accurately"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Study Status</p>
        <div className="space-y-1.5">
          <Radio
            label="All studies"
            checked={filters.study_status === "all"}
            onChange={() => set("study_status", "all")}
          />
          <Radio
            label="Recruiting and not yet recruiting studies"
            checked={filters.study_status === "recruiting_not_yet"}
            onChange={() => set("study_status", "recruiting_not_yet")}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowMoreFilters((v) => !v)}
        className="block text-sm font-semibold text-teal-600 hover:underline"
      >
        {showMoreFilters ? "− Fewer filters" : "+ More filters"}
      </button>

      {showMoreFilters && (
        <div className="space-y-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-800">Eligibility Criteria</p>

            <div className="mb-4">
              <p className="mb-1 text-sm font-medium text-slate-700">Sex</p>
              <div className="flex gap-4">
                <Radio label="All" checked={filters.sex === "all"} onChange={() => set("sex", "all")} />
                <Radio
                  label="Female"
                  checked={filters.sex === "female"}
                  onChange={() => set("sex", "female")}
                />
                <Radio label="Male" checked={filters.sex === "male"} onChange={() => set("sex", "male")} />
              </div>
            </div>

            <div className="mb-4">
              <p className="mb-1 text-sm font-medium text-slate-700">Age</p>
              <div className="mb-2 flex gap-4">
                <Radio
                  label="Select ranges"
                  checked={ageMode === "ranges"}
                  onChange={() => {
                    setAgeMode("ranges");
                    onFiltersChange({ ...filters, age_min: null, age_max: null });
                  }}
                />
                <Radio
                  label="Manually enter range"
                  checked={ageMode === "manual"}
                  onChange={() => {
                    setAgeMode("manual");
                    set("age_groups", []);
                  }}
                />
              </div>
              {ageMode === "ranges" ? (
                <div className="space-y-1.5 pl-1">
                  {AGE_GROUP_OPTIONS.map((opt) => (
                    <Checkbox
                      key={opt.value}
                      label={opt.label}
                      checked={filters.age_groups.includes(opt.value)}
                      onChange={() => set("age_groups", toggleInArray(filters.age_groups, opt.value))}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pl-1">
                  <div>
                    <label htmlFor="age-min" className="mb-0.5 block text-xs text-slate-500">
                      From (years old)
                    </label>
                    <input
                      id="age-min"
                      type="number"
                      min={0}
                      max={130}
                      value={filters.age_min ?? ""}
                      onChange={(e) => set("age_min", e.target.value ? Number(e.target.value) : null)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="age-max" className="mb-0.5 block text-xs text-slate-500">
                      To (years old)
                    </label>
                    <input
                      id="age-max"
                      type="number"
                      min={0}
                      max={130}
                      value={filters.age_max ?? ""}
                      onChange={(e) => set("age_max", e.target.value ? Number(e.target.value) : null)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <Checkbox
              label="Accepts healthy volunteers"
              checked={filters.accepts_healthy_volunteers}
              onChange={() => set("accepts_healthy_volunteers", !filters.accepts_healthy_volunteers)}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-800">Study Phase</p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {PHASE_OPTIONS.map((opt) => (
                <Checkbox
                  key={opt.value}
                  label={opt.label}
                  checked={filters.phases.includes(opt.value)}
                  onChange={() => set("phases", toggleInArray(filters.phases, opt.value))}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-800">Study Type</p>
            <div className="space-y-1.5">
              <Checkbox
                label="Interventional"
                checked={filters.study_types.includes("interventional")}
                onChange={() => set("study_types", toggleInArray(filters.study_types, "interventional" as StudyType))}
              />
              <Checkbox
                label="Observational"
                checked={filters.study_types.includes("observational")}
                onChange={() => set("study_types", toggleInArray(filters.study_types, "observational" as StudyType))}
              />
              <Checkbox
                label="Patient registries"
                checked={filters.study_types.includes("patient_registries")}
                onChange={() =>
                  set("study_types", toggleInArray(filters.study_types, "patient_registries" as StudyType))
                }
              />
              <Checkbox
                label="Expanded access"
                checked={filters.study_types.includes("expanded_access")}
                onChange={() =>
                  set("study_types", toggleInArray(filters.study_types, "expanded_access" as StudyType))
                }
              />
              {filters.study_types.includes("expanded_access") && (
                <div className="ml-6 space-y-1.5 border-l border-slate-200 pl-3">
                  {EXPANDED_ACCESS_OPTIONS.map((opt) => (
                    <Checkbox
                      key={opt.value}
                      label={opt.label}
                      checked={filters.expanded_access_types.includes(opt.value)}
                      onChange={() =>
                        set("expanded_access_types", toggleInArray(filters.expanded_access_types, opt.value))
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-800">Study Results</p>
            <div className="space-y-1.5">
              <Checkbox label="With results" checked={resultsWith} onChange={() => toggleHasResults("with")} />
              <Checkbox
                label="Without results"
                checked={resultsWithout}
                onChange={() => toggleHasResults("without")}
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-800">Study Documents</p>
            <div className="space-y-1.5">
              {DOCUMENT_OPTIONS.map((opt) => (
                <Checkbox
                  key={opt.value}
                  label={opt.label}
                  checked={filters.study_documents.includes(opt.value)}
                  onChange={() => set("study_documents", toggleInArray(filters.study_documents, opt.value))}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-800">Funder Type</p>
            <div className="space-y-1.5">
              {FUNDER_OPTIONS.map((opt) => (
                <Checkbox
                  key={opt.value}
                  label={opt.label}
                  checked={filters.funder_types.includes(opt.value)}
                  onChange={() => set("funder_types", toggleInArray(filters.funder_types, opt.value))}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-slate-800">Date Range</p>
            <div className="space-y-4">
              <DateRangeRow
                label="Study start"
                from={filters.study_start_from || ""}
                to={filters.study_start_to || ""}
                onFromChange={(v) => set("study_start_from", v)}
                onToChange={(v) => set("study_start_to", v)}
              />
              <DateRangeRow
                label="Primary completion"
                from={filters.primary_completion_from || ""}
                to={filters.primary_completion_to || ""}
                onFromChange={(v) => set("primary_completion_from", v)}
                onToChange={(v) => set("primary_completion_to", v)}
              />
              <DateRangeRow
                label="First posted"
                from={filters.first_posted_from || ""}
                to={filters.first_posted_to || ""}
                onFromChange={(v) => set("first_posted_from", v)}
                onToChange={(v) => set("first_posted_to", v)}
              />
              <DateRangeRow
                label="Results first posted"
                from={filters.results_first_posted_from || ""}
                to={filters.results_first_posted_to || ""}
                onFromChange={(v) => set("results_first_posted_from", v)}
                onToChange={(v) => set("results_first_posted_to", v)}
              />
              <DateRangeRow
                label="Last update posted"
                from={filters.last_update_posted_from || ""}
                to={filters.last_update_posted_to || ""}
                onFromChange={(v) => set("last_update_posted_from", v)}
                onToChange={(v) => set("last_update_posted_to", v)}
              />
              <DateRangeRow
                label="Study completion"
                from={filters.study_completion_from || ""}
                to={filters.study_completion_to || ""}
                onFromChange={(v) => set("study_completion_from", v)}
                onToChange={(v) => set("study_completion_to", v)}
              />
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowMoreWaysToSearch((v) => !v)}
        className="block text-sm font-semibold text-teal-600 hover:underline"
      >
        {showMoreWaysToSearch ? "− Fewer ways to search" : "+ More ways to search"}
      </button>

      {showMoreWaysToSearch && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <TextField
            label="Title and/or Title Acronym"
            value={filters.title || ""}
            onChange={(v) => set("title", v)}
          />
        </div>
      )}

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <p className="text-xs text-slate-400">
        This is a screening aid, not medical advice. Always discuss trial options with your
        doctor before enrolling.
      </p>

      <div className="flex justify-end">
        <button
          onClick={onSubmit}
          disabled={loading}
          className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Searching ClinicalTrials.gov..." : "Search"}
        </button>
      </div>
    </div>
  );
}
