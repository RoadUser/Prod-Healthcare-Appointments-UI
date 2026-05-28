import { useEffect, useMemo, useState } from "react";
import { ApiService } from "@/services/api-service";
import { formatLocal } from "@/utils/time";
import { ChartColumn, Calendar } from "lucide-react";

type Row = { key: string; count: number };

export default function AdminAnalytics() {
  const api = useMemo(() => ApiService.getInstance(), []);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // NOTE: Contract does not provide analytics endpoints.
        // We compute a small summary using available public doctor list + per-doctor schedule.
        const doctors = (await api.listDoctors({ active: true })).doctors;
        const start = new Date(Date.now() - 7 * 86400000).toISOString();
        const end = new Date(Date.now() + 7 * 86400000).toISOString();

        const counts: Record<string, number> = {};
        for (const d of doctors.slice(0, 10)) {
          try {
            const s = await api.viewSchedule({ doctorId: d.id, startDateUtc: start, endDateUtc: end });
            counts[d.displayName] = (s.appointments || []).length;
          } catch {
            counts[d.displayName] = 0;
          }
        }

        const out = Object.entries(counts)
          .map(([key, count]) => ({ key, count }))
          .sort((a, b) => b.count - a.count);
        setRows(out);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [api]);

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center gap-2">
          <ChartColumn className="h-5 w-5 text-blue-600" />
          <h1 className="text-2xl font-bold">Analytics</h1>
        </div>
        <p className="mt-1 text-slate-600">
          The contract currently does not expose dedicated analytics endpoints. This page computes a basic view client-side.
        </p>
        <p className="mt-1 text-xs text-slate-500">Generated at {formatLocal(new Date().toISOString())}</p>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2 font-bold">
          <Calendar className="h-4 w-4 text-blue-600" />
          Appointment counts (sample)
        </div>
        {loading ? <p className="mt-3 text-slate-600">Loading...</p> : null}
        <div className="mt-3 divide-y divide-slate-100">
          {rows.map(r => (
            <div key={r.key} className="px-3 py-3 flex items-center justify-between">
              <p className="font-semibold text-slate-900">{r.key}</p>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{r.count}</span>
            </div>
          ))}
          {!loading && rows.length === 0 ? (
            <div className="py-10 text-center text-slate-600">No data.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
