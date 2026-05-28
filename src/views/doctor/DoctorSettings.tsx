import { useEffect, useMemo, useState } from "react";
import { ApiService } from "@/services/api-service";
import { useAppSelector } from "@/app/hooks";
import { requireInt, requireString, requireTimeHHMM, requireDateIso } from "@/utils/validators";
import { Save, Plus, Trash2 } from "lucide-react";

type Rule = { dayOfWeek: number; startTime: string; endTime: string };
type ExDay = { date: string; available: boolean };
type Blackout = { startUtc: string; endUtc: string };

export default function DoctorSettings() {
  const api = useMemo(() => ApiService.getInstance(), []);
  const doctorId = useAppSelector(s => s.auth?.doctorId);

  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);
  const [exceptionDays, setExceptionDays] = useState<ExDay[]>([]);
  const [blackoutRanges, setBlackoutRanges] = useState<Blackout[]>([]);

  const [active, setActive] = useState(true);
  const [bufferMinutes, setBufferMinutes] = useState(10);
  const [durations, setDurations] = useState<string>("30");
  const [maxDaily, setMaxDaily] = useState(10);

  useEffect(() => {
    const load = async () => {
      if (!doctorId) return;
      setLoading(true);
      try {
        const d = await api.getDoctor({ doctorId });
        setRules(d.doctor.availabilityRules);
        setExceptionDays(d.doctor.exceptionDays);
        setBlackoutRanges(d.doctor.blackoutRanges);
        setActive(d.doctor.active);
        setBufferMinutes(d.doctor.bufferMinutes);
        setDurations(d.doctor.appointmentDurationsMinutes.join(","));
        setMaxDaily(d.doctor.maxDailyAppointments);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [api, doctorId]);

  const saveDoctor = async () => {
    if (!doctorId) return;
    const parsedDurations = durations
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => requireInt(parseInt(s, 10), "duration", 5, 480));

    await api.updateDoctor({
      doctorId,
      fields: {
        bufferMinutes: requireInt(bufferMinutes, "bufferMinutes", 0, 240),
        maxDailyAppointments: requireInt(maxDaily, "maxDailyAppointments", 1, 200),
        appointmentDurationsMinutes: parsedDurations,
        overbookingAllowed: false
      }
    });

    await api.setDoctorActive({ doctorId, active });

    await api.setDoctorAvailability({
      doctorId,
      availabilityRules: rules.map(r => ({ dayOfWeek: requireInt(r.dayOfWeek, "dayOfWeek", 0, 6), startTime: requireTimeHHMM(r.startTime, "startTime"), endTime: requireTimeHHMM(r.endTime, "endTime") })),
      exceptionDays: exceptionDays.map(e => ({ date: requireDateIso(e.date, "date"), available: !!e.available })),
      blackoutRanges
    });
  };

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Doctor Settings</h1>
        <p className="mt-1 text-slate-600">Manage availability rules, exception days, blackout ranges, and basic scheduling settings.</p>

        {!doctorId ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800 text-sm">
            Doctor role is selected but no doctorId is linked.
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 p-4 bg-white">
            <h2 className="font-bold">Scheduling</h2>
            <div className="mt-3 space-y-3">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
                Active
              </label>
              <div>
                <label className="label">Buffer minutes</label>
                <input className="input" type="number" value={bufferMinutes} onChange={e => setBufferMinutes(parseInt(e.target.value || "0", 10))} />
              </div>
              <div>
                <label className="label">Allowed durations (comma-separated)</label>
                <input className="input" value={durations} onChange={e => setDurations(e.target.value)} placeholder="15,30" />
              </div>
              <div>
                <label className="label">Max daily appointments</label>
                <input className="input" type="number" value={maxDaily} onChange={e => setMaxDaily(parseInt(e.target.value || "0", 10))} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 bg-white">
            <h2 className="font-bold">Availability rules</h2>
            <p className="text-sm text-slate-600">Weekly recurrence (UTC dayOfWeek) with HH:MM windows.</p>

            <div className="mt-3 space-y-2">
              {rules.map((r, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2">
                  <input className="input" type="number" min={0} max={6} value={r.dayOfWeek} onChange={e => {
                    const v = parseInt(e.target.value || "0", 10);
                    setRules(prev => prev.map((x, i) => (i === idx ? { ...x, dayOfWeek: v } : x)));
                  }} />
                  <input className="input" value={r.startTime} onChange={e => setRules(prev => prev.map((x, i) => (i === idx ? { ...x, startTime: e.target.value } : x)))} placeholder="09:00" />
                  <input className="input" value={r.endTime} onChange={e => setRules(prev => prev.map((x, i) => (i === idx ? { ...x, endTime: e.target.value } : x)))} placeholder="17:00" />
                  <button className="btn-danger" onClick={() => setRules(prev => prev.filter((_, i) => i !== idx))}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button className="btn-secondary" onClick={() => setRules(prev => [...prev, { dayOfWeek: 1, startTime: "09:00", endTime: "10:00" }])}>
                <Plus className="h-4 w-4" /> Add rule
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 p-4 bg-white">
            <h2 className="font-bold">Exception days</h2>
            <p className="text-sm text-slate-600">YYYY-MM-DD override availability.</p>
            <div className="mt-3 space-y-2">
              {exceptionDays.map((e, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-2">
                  <input className="input" value={e.date} onChange={ev => setExceptionDays(prev => prev.map((x, i) => (i === idx ? { ...x, date: ev.target.value } : x)))} placeholder="2026-01-31" />
                  <select className="input" value={String(e.available)} onChange={ev => setExceptionDays(prev => prev.map((x, i) => (i === idx ? { ...x, available: ev.target.value === "true" } : x)))}>
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </select>
                  <button className="btn-danger" onClick={() => setExceptionDays(prev => prev.filter((_, i) => i !== idx))}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button className="btn-secondary" onClick={() => setExceptionDays(prev => [...prev, { date: "2026-01-01", available: false }])}>
                <Plus className="h-4 w-4" /> Add exception
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 bg-white">
            <h2 className="font-bold">Blackout ranges (UTC)</h2>
            <p className="text-sm text-slate-600">ISO timestamps ending with Z.</p>
            <div className="mt-3 space-y-2">
              {blackoutRanges.map((b, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-2">
                  <input className="input" value={b.startUtc} onChange={ev => setBlackoutRanges(prev => prev.map((x, i) => (i === idx ? { ...x, startUtc: ev.target.value } : x)))} placeholder="2026-01-01T00:00:00.000Z" />
                  <input className="input" value={b.endUtc} onChange={ev => setBlackoutRanges(prev => prev.map((x, i) => (i === idx ? { ...x, endUtc: ev.target.value } : x)))} placeholder="2026-01-02T00:00:00.000Z" />
                  <button className="btn-danger" onClick={() => setBlackoutRanges(prev => prev.filter((_, i) => i !== idx))}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button className="btn-secondary" onClick={() => setBlackoutRanges(prev => [...prev, { startUtc: new Date().toISOString(), endUtc: new Date(Date.now() + 3600000).toISOString() }])}>
                <Plus className="h-4 w-4" /> Add blackout
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <button className="btn-primary" onClick={saveDoctor} disabled={loading || !doctorId}>
            <Save className="h-4 w-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
