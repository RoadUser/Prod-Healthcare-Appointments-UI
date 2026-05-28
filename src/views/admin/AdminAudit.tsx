import { useMemo, useState } from "react";
import { useAppSelector } from "@/app/hooks";
import { Search, CircleAlert } from "lucide-react";

export default function AdminAudit() {
  const supported = useAppSelector(s => s.audit?.supportedByContract ?? false);
  const items = useAppSelector(s => s.audit?.items ?? []);

  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter(i =>
      [i.actorRole, i.actorId, i.action, i.targetId || "", i.timestampUtc]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [items, q]);

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Audit Log Viewer</h1>
        <p className="mt-1 text-slate-600">The current contract does not expose audit log query endpoints.</p>
        {!supported ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 flex gap-2">
            <CircleAlert className="h-4 w-4 mt-0.5" />
            <span>Live contract mode: audit queries are not available. Mock mode can simulate logs.</span>
          </div>
        ) : null}
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex-1">
            <label className="label">Search</label>
            <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="actorId, action, time..." />
          </div>
          <div className="md:w-56">
            <button className="btn-secondary w-full" onClick={() => setQ("")}>
              <Search className="h-4 w-4" /> Clear
            </button>
          </div>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {filtered.map(i => (
            <div key={i.id} className="px-3 py-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900">{i.action}</p>
                <p className="text-xs text-slate-500">{i.timestampUtc}</p>
              </div>
              <p className="text-sm text-slate-600">{i.actorRole} · {i.actorId}</p>
              <p className="text-xs text-slate-500">Target: {i.targetId || "(none)"}</p>
            </div>
          ))}
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-slate-600">No audit items.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
