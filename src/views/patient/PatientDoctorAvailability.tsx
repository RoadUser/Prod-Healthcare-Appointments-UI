import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ApiService } from "@/services/api-service";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { doctorsActions } from "@/features/doctors/doctorsSlice";
import { availabilityActions } from "@/features/availability/availabilitySlice";
import { policyActions } from "@/features/policy/policySlice";
import { snackbarActions } from "@/features/snackbar/snackbarSlice";
import Loading from "@/Components/Shared/Loading";
import { formatLocal, startOfLocalDayToUtcIso, addDaysUtcIso, isPastUtc } from "@/utils/time";
import { sanitizeReasonCode, requireString } from "@/utils/validators";
import { downloadIcs, appointmentToIcs } from "@/utils/ics";
import { Calendar, Save, CircleAlert, Download } from "lucide-react";

function uid() {
  const b = new Uint8Array(10);
  crypto.getRandomValues(b);
  return Array.from(b).map(x => x.toString(16).padStart(2, "0")).join("");
}

export default function PatientDoctorAvailability() {
  const { doctorId } = useParams();
  const api = useMemo(() => ApiService.getInstance(), []);
  const dispatch = useAppDispatch();

  const doctor = useAppSelector(s => s.doctors?.selectedDoctor);
  const slots = useAppSelector(s => s.availability?.slots ?? []);
  const loading = useAppSelector(s => (s.doctors?.loading ?? false) || (s.availability?.loading ?? false));
  const policy = useAppSelector(s => s.policy?.policy);

  const [rangeStart, setRangeStart] = useState<Date>(() => new Date());
  const [reasonCode, setReasonCode] = useState("CHECKUP");
  const [notesBlobRef, setNotesBlobRef] = useState("");
  const [selectedSlotStartUtc, setSelectedSlotStartUtc] = useState<string>("");
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!doctorId) return;
      dispatch(doctorsActions.setLoading(true));
      dispatch(availabilityActions.setLoading(true));
      dispatch(policyActions.setLoading(true));
      try {
        const d = await api.getDoctor({ doctorId });
        dispatch(doctorsActions.setSelectedDoctor(d.doctor));

        const pol = await api.getPolicy();
        dispatch(policyActions.setPolicy(pol));

        const startUtc = startOfLocalDayToUtcIso(rangeStart);
        const endUtc = addDaysUtcIso(startUtc, 7);
        dispatch(availabilityActions.setRange({ startUtc, endUtc }));
        const av = await api.getAvailability({ doctorId, startDateUtc: startUtc, endDateUtc: endUtc });
        dispatch(availabilityActions.setSlots(av.slots));

        const firstDuration = d.doctor.appointmentDurationsMinutes?.[0] ?? 30;
        setDurationMinutes(firstDuration);
      } catch (e) {
        dispatch(snackbarActions.push({ id: uid(), kind: "error", title: "Load failed", message: e instanceof Error ? e.message : "Unknown" }));
      } finally {
        dispatch(doctorsActions.setLoading(false));
        dispatch(availabilityActions.setLoading(false));
        dispatch(policyActions.setLoading(false));
      }
    };

    void load();
  }, [api, dispatch, doctorId, rangeStart]);

  const refresh = async () => {
    if (!doctorId) return;
    dispatch(availabilityActions.setLoading(true));
    try {
      const startUtc = startOfLocalDayToUtcIso(rangeStart);
      const endUtc = addDaysUtcIso(startUtc, 7);
      dispatch(availabilityActions.setRange({ startUtc, endUtc }));
      const av = await api.getAvailability({ doctorId, startDateUtc: startUtc, endDateUtc: endUtc });
      dispatch(availabilityActions.setSlots(av.slots));
    } catch (e) {
      dispatch(snackbarActions.push({ id: uid(), kind: "error", title: "Refresh failed", message: e instanceof Error ? e.message : "Unknown" }));
    } finally {
      dispatch(availabilityActions.setLoading(false));
    }
  };

  const book = async () => {
    setError(null);
    try {
      if (!doctorId) throw new Error("Missing doctorId");
      const rsn = sanitizeReasonCode(reasonCode);
      const slotStartUtc = requireString(selectedSlotStartUtc, "slotStartUtc", 40);
      if (isPastUtc(slotStartUtc)) throw new Error("Cannot book past slots");

      if (doctor && !doctor.appointmentDurationsMinutes.includes(durationMinutes)) {
        throw new Error("Selected duration is not allowed by this doctor");
      }

      if (notesBlobRef && notesBlobRef.length > 200) throw new Error("notesBlobRef too long (max 200)");

      // Policy warnings
      const cancelWin = policy?.cancellationWindowMinutes ?? 60;
      const reschedWin = policy?.rescheduleWindowMinutes ?? 120;

      setBusy(true);
      const res = await api.bookAppointment({
        doctorId,
        slotStartUtc,
        durationMinutes,
        reasonCode: rsn,
        notesBlobRef: notesBlobRef.trim() ? notesBlobRef.trim() : undefined
      });

      dispatch(
        snackbarActions.push({
          id: uid(),
          kind: "success",
          title: "Booked",
          message: `Appointment created. Cancellation window: ${cancelWin} min · Reschedule window: ${reschedWin} min`
        })
      );

      // refresh availability
      await refresh();

      // offer ICS for immediate add-to-calendar
      if (res?.appointment) {
        const ics = appointmentToIcs(res.appointment, `Appointment with ${doctor?.displayName || "Doctor"}`, `Reason: ${rsn}`);
        downloadIcs(`appointment-${res.appointment.id}.ics`, ics);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Booking failed";
      setError(msg);
      dispatch(snackbarActions.push({ id: uid(), kind: "error", title: "Booking failed", message: msg }));
    } finally {
      setBusy(false);
    }
  };

  const slotsForDuration = slots.filter(s => s.durationMinutes === durationMinutes);

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Availability</h1>
            <p className="mt-1 text-slate-600">Select a slot and book. Times shown in your local timezone.</p>
          </div>
          <button className="btn-secondary" onClick={refresh} disabled={busy}>
            <Calendar className="h-4 w-4" /> Refresh
          </button>
        </div>

        {doctor ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-bold text-slate-900">{doctor.displayName}</p>
            <p className="text-sm text-slate-600">{doctor.specialty} · {doctor.timeZone}</p>
            <p className="text-xs text-slate-500 mt-1">Allowed durations: {doctor.appointmentDurationsMinutes.join(", ")} minutes</p>
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <label className="label">Week starting (local)</label>
            <input
              className="input"
              type="date"
              value={new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate()).toISOString().slice(0, 10)}
              onChange={e => setRangeStart(new Date(e.target.value + "T00:00:00"))}
            />
            <p className="hint mt-1">Slots are generated on-chain (UTC). Displayed locally.</p>
          </div>

          <div>
            <label className="label">Duration (minutes)</label>
            <select className="input" value={String(durationMinutes)} onChange={e => setDurationMinutes(parseInt(e.target.value, 10))}>
              {(doctor?.appointmentDurationsMinutes ?? [30]).map(d => (
                <option key={d} value={String(d)}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Reason code</label>
            <input className="input" value={reasonCode} onChange={e => setReasonCode(e.target.value)} maxLength={32} />
            <p className="hint mt-1">Allowed: letters/numbers/underscore/dash/dot, max 32.</p>
          </div>
        </div>

        <div className="mt-4">
          <label className="label">Encrypted notes blob reference (optional)</label>
          <input className="input" value={notesBlobRef} onChange={e => setNotesBlobRef(e.target.value)} maxLength={200} placeholder="blob://..." />
          <p className="hint mt-1">Opaque reference; contract does not interpret content.</p>
        </div>

        {policy ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <p className="font-semibold">Policy reminder</p>
            <ul className="list-disc pl-5 mt-1">
              <li>Cancellation window: {policy.cancellationWindowMinutes} minutes before start</li>
              <li>Reschedule window: {policy.rescheduleWindowMinutes} minutes before start</li>
              <li>Patient notes allowed: {policy.allowPatientNotes ? "Yes" : "No"}</li>
            </ul>
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800 text-sm flex gap-2">
            <CircleAlert className="h-4 w-4 mt-0.5" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-4 border border-slate-200">
            <h2 className="font-bold text-slate-900">Slots</h2>
            <p className="text-sm text-slate-600">Showing {slotsForDuration.length} slots for {durationMinutes} minutes.</p>
            {loading ? <Loading /> : null}
            <div className="mt-3 max-h-[420px] overflow-auto divide-y divide-slate-100">
              {slotsForDuration.map(s => (
                <button
                  key={s.slotStartUtc + s.durationMinutes}
                  className={
                    "w-full text-left px-3 py-3 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 " +
                    (selectedSlotStartUtc === s.slotStartUtc ? "bg-blue-50" : "")
                  }
                  onClick={() => setSelectedSlotStartUtc(s.slotStartUtc)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{formatLocal(s.slotStartUtc, { weekday: "short" })}</p>
                      <p className="text-sm text-slate-600">{formatLocal(s.slotStartUtc)} → {formatLocal(s.slotEndUtc, { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-700 rounded-full bg-slate-100 px-3 py-1">{s.durationMinutes}m</span>
                  </div>
                </button>
              ))}
              {!loading && slotsForDuration.length === 0 ? (
                <div className="py-10 text-center text-slate-600">No available slots in this range.</div>
              ) : null}
            </div>
          </div>

          <div className="card p-4 border border-slate-200">
            <h2 className="font-bold text-slate-900">Confirm booking</h2>
            <p className="text-sm text-slate-600">Selected slot: {selectedSlotStartUtc ? formatLocal(selectedSlotStartUtc) : "None"}</p>
            <div className="mt-4 flex flex-col gap-3">
              <button className="btn-primary" onClick={book} disabled={busy || !selectedSlotStartUtc}>
                <Save className="h-4 w-4" />
                {busy ? "Submitting..." : "Book Appointment"}
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  if (!selectedSlotStartUtc || !doctor) return;
                  const fakeAppt = {
                    id: "preview",
                    clinicId: doctor.clinicId,
                    doctorId: doctor.id,
                    patientId: "",
                    startTimeUtc: selectedSlotStartUtc,
                    endTimeUtc: new Date(Date.parse(selectedSlotStartUtc) + durationMinutes * 60000).toISOString(),
                    status: "BOOKED" as const,
                    reasonCode,
                    notesBlobRef: notesBlobRef || null,
                    createdAtUtc: new Date().toISOString(),
                    updatedAtUtc: new Date().toISOString()
                  };
                  const ics = appointmentToIcs(fakeAppt as any, `Appointment with ${doctor.displayName}`, `Reason: ${reasonCode}`);
                  downloadIcs(`appointment-preview.ics`, ics);
                }}
                disabled={!selectedSlotStartUtc}
              >
                <Download className="h-4 w-4" /> Export ICS (preview)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
