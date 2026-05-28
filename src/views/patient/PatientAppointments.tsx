import { useEffect, useMemo, useState } from "react";
import { ApiService } from "@/services/api-service";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { appointmentsActions } from "@/features/appointments/appointmentsSlice";
import { snackbarActions } from "@/features/snackbar/snackbarSlice";
import Loading from "@/Components/Shared/Loading";
import AppointmentStatusBadge from "@/Components/Patient/AppointmentStatusBadge";
import { formatLocal, toUtcIsoFromLocalDateTimeInput } from "@/utils/time";
import { sanitizeReasonCode, requireString } from "@/utils/validators";
import { appointmentToIcs, downloadIcs } from "@/utils/ics";
import { Calendar, Download, Save, Trash2 } from "lucide-react";
import type { Appointment } from "@/types";

function uid() {
  const b = new Uint8Array(10);
  crypto.getRandomValues(b);
  return Array.from(b).map(x => x.toString(16).padStart(2, "0")).join("");
}

export default function PatientAppointments() {
  const api = useMemo(() => ApiService.getInstance(), []);
  const dispatch = useAppDispatch();
  const items = useAppSelector(s => s.appointments?.items ?? []);
  const loading = useAppSelector(s => s.appointments?.loading ?? false);
  const policy = useAppSelector(s => s.policy?.policy);

  const [fromLocal, setFromLocal] = useState<string>(() => {
    const d = new Date(Date.now() - 7 * 86400000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T00:00`;
  });
  const [toLocal, setToLocal] = useState<string>(() => {
    const d = new Date(Date.now() + 30 * 86400000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T23:59`;
  });

  const [cancelReason, setCancelReason] = useState("CHANGE_OF_PLANS");
  const [reschedLocal, setReschedLocal] = useState<string>("");
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    dispatch(appointmentsActions.setLoading(true));
    try {
      const startUtc = toUtcIsoFromLocalDateTimeInput(fromLocal);
      const endUtc = toUtcIsoFromLocalDateTimeInput(toLocal);
      const res = await api.listAppointmentsByPatient({ startDateUtc: startUtc, endDateUtc: endUtc });
      dispatch(appointmentsActions.setAppointments(res.appointments));
    } catch (e) {
      dispatch(snackbarActions.push({ id: uid(), kind: "error", title: "Load failed", message: e instanceof Error ? e.message : "Unknown" }));
    } finally {
      dispatch(appointmentsActions.setLoading(false));
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doCancel = async () => {
    if (!selected) return;
    try {
      setBusy(true);
      const reasonCode = sanitizeReasonCode(cancelReason);
      await api.cancelAppointment({ appointmentId: selected.id, reasonCode });
      dispatch(snackbarActions.push({ id: uid(), kind: "success", title: "Cancelled", message: "Appointment cancelled" }));
      await load();
    } catch (e) {
      dispatch(snackbarActions.push({ id: uid(), kind: "error", title: "Cancel failed", message: e instanceof Error ? e.message : "Unknown" }));
    } finally {
      setBusy(false);
    }
  };

  const doReschedule = async () => {
    if (!selected) return;
    try {
      setBusy(true);
      const newSlotStartUtc = toUtcIsoFromLocalDateTimeInput(requireString(reschedLocal, "new time"));
      await api.rescheduleAppointment({ appointmentId: selected.id, newSlotStartUtc });
      dispatch(snackbarActions.push({ id: uid(), kind: "success", title: "Rescheduled", message: "Appointment rescheduled" }));
      await load();
    } catch (e) {
      dispatch(snackbarActions.push({ id: uid(), kind: "error", title: "Reschedule failed", message: e instanceof Error ? e.message : "Unknown" }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">My Appointments</h1>
        <p className="mt-1 text-slate-600">Times shown in your local timezone. Policy windows apply for cancellation/reschedule.</p>

        {policy ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Cancellation: {policy.cancellationWindowMinutes} min · Reschedule: {policy.rescheduleWindowMinutes} min
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="label">From (local)</label>
            <input className="input" type="datetime-local" value={fromLocal} onChange={e => setFromLocal(e.target.value)} />
          </div>
          <div>
            <label className="label">To (local)</label>
            <input className="input" type="datetime-local" value={toLocal} onChange={e => setToLocal(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full" onClick={load} disabled={busy}>
              <Calendar className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>
      </div>

      {loading ? <Loading /> : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="font-bold">Appointment list</h2>
          <div className="mt-3 divide-y divide-slate-100">
            {items.map(a => (
              <button
                key={a.id}
                className={
                  "w-full text-left px-3 py-3 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 " +
                  (selected?.id === a.id ? "bg-blue-50" : "")
                }
                onClick={() => {
                  setSelected(a);
                  setReschedLocal("");
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{formatLocal(a.startTimeUtc)}</p>
                    <p className="text-sm text-slate-600">Doctor: {a.doctorId} · Clinic: {a.clinicId}</p>
                    <p className="text-xs text-slate-500">Reason: {a.reasonCode}</p>
                  </div>
                  <AppointmentStatusBadge status={a.status} />
                </div>
              </button>
            ))}
            {!loading && items.length === 0 ? (
              <div className="py-10 text-center text-slate-600">No appointments in this range.</div>
            ) : null}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="font-bold">Details & actions</h2>
          {!selected ? (
            <div className="py-10 text-center text-slate-600">Select an appointment to manage it.</div>
          ) : (
            <div className="mt-3 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{selected.id}</p>
                  <AppointmentStatusBadge status={selected.status} />
                </div>
                <p className="text-sm text-slate-700 mt-1">{formatLocal(selected.startTimeUtc)} → {formatLocal(selected.endTimeUtc)}</p>
                <p className="text-xs text-slate-500 mt-1">notesBlobRef: {selected.notesBlobRef || "(none)"}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    const ics = appointmentToIcs(selected, `Appointment (${selected.doctorId})`, `Reason: ${selected.reasonCode}`);
                    downloadIcs(`appointment-${selected.id}.ics`, ics);
                  }}
                >
                  <Download className="h-4 w-4" /> Export ICS
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <p className="font-semibold">Reschedule</p>
                <p className="text-sm text-slate-600">Choose a new local time (contract validates policy windows).</p>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input className="input" type="datetime-local" value={reschedLocal} onChange={e => setReschedLocal(e.target.value)} />
                  <button className="btn-primary" disabled={busy || !reschedLocal} onClick={doReschedule}>
                    <Save className="h-4 w-4" /> Submit
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <p className="font-semibold">Cancel</p>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input className="input" value={cancelReason} onChange={e => setCancelReason(e.target.value)} maxLength={32} />
                  <button className="btn-danger" disabled={busy} onClick={doCancel}>
                    <Trash2 className="h-4 w-4" /> Cancel
                  </button>
                </div>
                <p className="hint mt-1">Reason code must match contract pattern, max 32.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
