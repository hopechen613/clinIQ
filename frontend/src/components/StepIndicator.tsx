const DEFAULT_STEPS = ["Protocol", "Patients", "Results"];

export default function StepIndicator({
  active,
  steps = DEFAULT_STEPS,
}: {
  active: number;
  steps?: string[];
}) {
  return (
    <ol className="flex items-center gap-4">
      {steps.map((label, i) => {
        const state = i < active ? "done" : i === active ? "active" : "todo";
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                state === "done"
                  ? "bg-teal-600 text-white"
                  : state === "active"
                    ? "bg-teal-600 text-white ring-4 ring-teal-100"
                    : "bg-slate-200 text-slate-500"
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`text-sm font-medium ${
                state === "todo" ? "text-slate-400" : "text-slate-800"
              }`}
            >
              {label}
            </span>
            {i < steps.length - 1 && <span className="mx-2 h-px w-8 bg-slate-200" />}
          </li>
        );
      })}
    </ol>
  );
}
