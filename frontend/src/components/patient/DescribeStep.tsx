"use client";

interface Props {
  patientText: string;
  onPatientTextChange: (text: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}

const EXAMPLE =
  "I'm a 64-year-old man near Boston, MA. I was diagnosed with stage IV non-small cell lung cancer about a year ago. I already tried chemo with carboplatin and pemetrexed but it stopped working a couple months ago. My doctor says my performance status is good and I haven't had immunotherapy yet.";

export default function DescribeStep({
  patientText,
  onPatientTextChange,
  onSubmit,
  loading,
  error,
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Tell us about your condition</h2>
        <p className="mt-1 text-sm text-slate-500">
          Describe your diagnosis, treatments you&apos;ve tried, and where you&apos;re located, in
          your own words. We&apos;ll search live clinical trials and explain which ones might fit.
        </p>
      </div>

      <textarea
        value={patientText}
        onChange={(e) => onPatientTextChange(e.target.value)}
        rows={8}
        placeholder={EXAMPLE}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm leading-relaxed focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
      />

      <p className="text-xs text-slate-400">
        This is a screening aid, not medical advice. Always discuss trial options with your
        doctor before enrolling.
      </p>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="flex justify-end">
        <button
          onClick={onSubmit}
          disabled={loading || patientText.trim().length < 10}
          className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Reading your description..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
