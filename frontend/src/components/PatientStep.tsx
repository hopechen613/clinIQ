"use client";

import { useRef, useState } from "react";
import type { ParseCriteriaResponse, PatientRecord } from "@/lib/types";
import CriteriaList from "./CriteriaList";

interface Props {
  criteria: ParseCriteriaResponse;
  patients: PatientRecord[];
  onPatientsChange: (patients: PatientRecord[]) => void;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}

export default function PatientStep({
  criteria,
  patients,
  onPatientsChange,
  onBack,
  onSubmit,
  loading,
  error,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pasteId, setPasteId] = useState("");
  const [pasteText, setPasteText] = useState("");

  async function handleFiles(files: FileList) {
    const newPatients: PatientRecord[] = [];
    for (const file of Array.from(files)) {
      const text = await file.text();
      newPatients.push({
        patient_id: file.name.replace(/\.(txt|md)$/i, ""),
        record_text: text,
      });
    }
    onPatientsChange([...patients, ...newPatients]);
  }

  function addPasted() {
    if (!pasteText.trim()) return;
    onPatientsChange([
      ...patients,
      {
        patient_id: pasteId.trim() || `patient-${patients.length + 1}`,
        record_text: pasteText.trim(),
      },
    ]);
    setPasteId("");
    setPasteText("");
  }

  function removePatient(id: string) {
    onPatientsChange(patients.filter((p) => p.patient_id !== id));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Review criteria & add patients</h2>
        <p className="mt-1 text-sm text-slate-500">
          Confirm the extracted criteria, then upload or paste de-identified patient records to
          screen against this trial.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <CriteriaList inclusion={criteria.inclusion_criteria} exclusion={criteria.exclusion_criteria} />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">Patient records ({patients.length})</h3>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
          }}
          className="rounded-lg border-2 border-dashed border-slate-300 p-4 text-center text-sm text-slate-500"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleFiles(e.target.files);
            }}
          />
          Drag one or more .txt patient record files here, or{" "}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="font-medium text-teal-600 hover:underline"
          >
            browse
          </button>
          <p className="mt-1 text-xs text-slate-400">Each file becomes one patient record.</p>
        </div>

        <div className="grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-[160px_1fr_auto]">
          <input
            type="text"
            value={pasteId}
            onChange={(e) => setPasteId(e.target.value)}
            placeholder="Patient ID"
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={2}
            placeholder="Paste a de-identified patient record / EHR excerpt..."
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <button
            type="button"
            onClick={addPasted}
            className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Add
          </button>
        </div>

        {patients.length > 0 && (
          <ul className="space-y-2">
            {patients.map((p) => (
              <li
                key={p.patient_id}
                className="flex items-start justify-between gap-3 rounded-md border border-slate-200 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{p.patient_id}</p>
                  <p className="line-clamp-2 text-xs text-slate-500">{p.record_text}</p>
                </div>
                <button
                  onClick={() => removePatient(p.patient_id)}
                  className="shrink-0 text-xs font-medium text-slate-400 hover:text-rose-600"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
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
          disabled={loading || patients.length === 0}
          className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Matching patients..." : `Match ${patients.length || ""} patient(s)`}
        </button>
      </div>
    </div>
  );
}
