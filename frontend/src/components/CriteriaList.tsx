import type { Criterion } from "@/lib/types";

function CriterionRow({ criterion }: { criterion: Criterion }) {
  return (
    <li className="flex items-start gap-3 rounded-md border border-slate-200 px-3 py-2">
      <span className="mt-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {criterion.category}
      </span>
      <p className="text-sm text-slate-700">{criterion.description}</p>
    </li>
  );
}

export default function CriteriaList({
  inclusion,
  exclusion,
}: {
  inclusion: Criterion[];
  exclusion: Criterion[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-emerald-700">
          Inclusion criteria ({inclusion.length})
        </h3>
        <ul className="space-y-2">
          {inclusion.map((c) => (
            <CriterionRow key={c.id} criterion={c} />
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-rose-700">
          Exclusion criteria ({exclusion.length})
        </h3>
        <ul className="space-y-2">
          {exclusion.map((c) => (
            <CriterionRow key={c.id} criterion={c} />
          ))}
        </ul>
      </div>
    </div>
  );
}
