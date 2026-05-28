import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/app/hooks";
import { ApiService } from "@/services/api-service";
import { formatLocal } from "@/utils/time";
import Loading from "@/Components/Shared/Loading";
import AppointmentStatusBadge from "@/Components/Patient/AppointmentStatusBadge";
import { Calendar, CircleAlert } from "lucide-react";

export default function DoctorDashboard() {
  const api = useMemo(() => ApiService.getInstance(), []);
  const doctorId = useAppSelector(s => s.auth?.doctorId);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!doctorId) {
        setError("Doctor role is selected but no doctorId is linked in session.");
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const start = new Date(Date.now() - 86400000).toISOString();
        const end = new Date(Date.now() + 14 * 86400000).toISOString();
        const res = await api.viewSchedule({ doctorId, startDateUtc: start, endDateUtc: end });
        setAppointments(res.appointments);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [api, doctorId]);

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
        <p className="mt-1 text-slate-600">Upcoming appointments and quick overview.</p>

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800 text-sm flex gap-2">
            <CircleAlert className="h-4 w-4 mt-0.5" />
            <span>{error}</span>
          </div>
        ) : null}
      </div>

      {loading ? <Loading /> : null}

      <div className="card p-4">
        <div className="flex items-center gap-2 font-bold">
          <Calendar className="h-4 w-4 text-blue-600" /> Upcoming
        </div>
        <div className="mt-3 divide-y divide-slate-100">
          {appointments.slice(0, 15).map(a => (
            <div key={a.id} className="px-3 py-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{formatLocal(a.startTimeUtc)}</p>
                <p className="text-sm text-slate-600">Patient: {a.patientId}</p>
              </div>
              <AppointmentStatusBadge status={a.status} />
            </div>
          ))}
          {!loading && appointments.length === 0 ? (
            <div className="py-10 text-center text-slate-600">No upcoming appointments.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
