"use client";

import { useRef, useState } from "react";

interface Props {
  protocolText: string;
  trialId: string;
  onProtocolTextChange: (text: string) => void;
  onTrialIdChange: (id: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}

export default function ProtocolStep({
  protocolText,
  trialId,
  onProtocolTextChange,
  onTrialIdChange,
  onSubmit,
  loading,
  error,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFile(file: File) {
    const text = await file.text();
    onProtocolTextChange(text);
    setFileName(file.name);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Upload trial protocol</h2>
        <p className="mt-1 text-sm text-slate-500">
          Paste the protocol text or upload a .txt file. Claude will extract structured
          inclusion and exclusion criteria.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Trial ID <span className="text-slate-400">(optional)</span>
        </label>
        <input
          type="text"
          value={trialId}
          onChange={(e) => onTrialIdChange(e.target.value)}
          placeholder="e.g. NCT05123456"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        className="rounded-lg border-2 border-dashed border-slate-300 p-4 text-center text-sm text-slate-500"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {fileName ? (
          <p>
            Loaded <span className="font-medium text-slate-700">{fileName}</span>
          </p>
        ) : (
          <p>
            Drag a .txt file here or{" "}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="font-medium text-teal-600 hover:underline"
            >
              browse
            </button>
          </p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Protocol text
        </label>
        <textarea
          value={protocolText}
          onChange={(e) => onProtocolTextChange(e.target.value)}
          rows={14}
          placeholder="Paste eligibility criteria / protocol text here..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs leading-relaxed focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="flex justify-end">
        <button
          onClick={onSubmit}
          disabled={loading || protocolText.trim().length < 20}
          className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Extracting criteria..." : "Extract eligibility criteria"}
        </button>
      </div>
    </div>
  );
}
