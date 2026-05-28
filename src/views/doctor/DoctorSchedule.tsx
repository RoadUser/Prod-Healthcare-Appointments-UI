import { useEffect, useMemo, useState } from "react";
import { ApiService } from "@/services/api-service";
import { useAppSelector } from "@/app/hooks";
import Loading from "@/Components/Shared/Loading";
import AppointmentStatusBadge from "@/Components/Patient/AppointmentStatusBadge";
import { formatLocal, toUtcIsoFromLocalDateTimeInput } from "@/utils/time";
import { sanitizeReasonCode } from "@/utils/validators";
import { Calendar, Save } from "lucide-react";

export default function DoctorSchedule() {
  const api = useMemo(() => ApiService.getInstance(), []);
  const doctorId = useAppSelector(s => s.auth?.doctorId);

  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);

  const [fromLocal, setFromLocal] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T00:00`;
  });
  const [toLocal, setToLocal] = useState<string>(() => {
    const d = new Date(Date.now() + 7 * 86400000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T23:59`;
  });

  const [blockStartLocal, setBlockStartLocal] = useState<string>("");
  const [blockEndLocal, setBlockEndLocal] = useState<string>("");
  const [blockReason, setBlockReason] = useState("BLOCK");

  const load = async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const startUtc = toUtcIsoFromLocalDateTimeInput(fromLocal);
      const endUtc = toUtcIsoFromLocalDateTimeInput(toLocal);
      const res = await api.viewSchedule({ doctorId, startDateUtc: startUtc, endDateUtc: endUtc });
      setAppointments(res.appointments);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);

  const block = async () => {
    if (!doctorId) return;
    const startUtc = toUtcIsoFromLocalDateTimeInput(blockStartLocal);
    const endUtc = toUtcIsoFromLocalDateTimeInput(blockEndLocal);
    const reasonCode = sanitizeReasonCode(blockReason);
    await api.blockTime({ doctorId, startUtc, endUtc, reasonCode });
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <p className="mt-1 text-slate-600">View appointments and block time ranges (times are local; sent as UTC).</p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="label">From</label>
            <input className="input" type="datetime-local" value={fromLocal} onChange={e => setFromLocal(e.target.value)} />
          </div>
          <div>
            <label className="label">To</label>
            <input className="input" type="datetime-local" value={toLocal} onChange={e => setToLocal(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full" onClick={load}>
              <Calendar className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>
      </div>

      {loading ? <Loading /> : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="font-bold">Appointments</h2>
          <div className="mt-3 divide-y divide-slate-100">
            {appointments.map(a => (
              <div key={a.id} className="px-3 py-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{formatLocal(a.startTimeUtc)}</p>
                  <p className="text-sm text-slate-600">Patient: {a.patientId}</p>
                  <p className="text-xs text-slate-500">Reason: {a.reasonCode}</p>
                </div>
                <AppointmentStatusBadge status={a.status} />
              </div>
            ))}
            {!loading && appointments.length === 0 ? (
              <div className="py-10 text-center text-slate-600">No appointments in this range.</div>
            ) : null}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="font-bold">Block time</h2>
          <p className="text-sm text-slate-600">Creates an AppointmentBlock on-chain.</p>
          <div className="mt-3 space-y-3">
            <div>
              <label className="label">Start</label>
              <input className="input" type="datetime-local" value={blockStartLocal} onChange={e => setBlockStartLocal(e.target.value)} />
            </div>
            <div>
              <label className="label">End</label>
              <input className="input" type="datetime-local" value={blockEndLocal} onChange={e => setBlockEndLocal(e.target.value)} />
            </div>
            <div>
              <label className="label">Reason code</label>
              <input className="input" value={blockReason} onChange={e => setBlockReason(e.target.value)} maxLength={32} />
            </div>
            <button className="btn-primary" onClick={block} disabled={!doctorId || !blockStartLocal || !blockEndLocal}>
              <Save className="h-4 w-4" /> Block
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
