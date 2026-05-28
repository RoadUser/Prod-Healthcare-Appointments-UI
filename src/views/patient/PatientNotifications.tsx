import { useAppSelector } from "@/app/hooks";
import { formatLocal } from "@/utils/time";

export default function PatientNotifications() {
  const events = useAppSelector(s => s.events?.items ?? []);

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="mt-1 text-slate-600">Real-time contract event stream.</p>
      </div>

      <div className="card p-4">
        {events.length === 0 ? (
          <div className="py-10 text-center text-slate-600">No events yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {events.map(e => (
              <div key={e.id} className="px-3 py-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{e.type}</p>
                  <p className="text-xs text-slate-500">{formatLocal(e.ts)}</p>
                </div>
                <pre className="mt-2 overflow-auto rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700">
{JSON.stringify(e.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
