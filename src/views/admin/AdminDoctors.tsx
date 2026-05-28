import { useEffect, useMemo, useState } from "react";
import { ApiService } from "@/services/api-service";
import { requireString, requireInt } from "@/utils/validators";
import { Plus, Save, Users } from "lucide-react";

export default function AdminDoctors() {
  const api = useMemo(() => ApiService.getInstance(), []);

  const [loading, setLoading] = useState(false);
  const [clinics, setClinics] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  const [clinicId, setClinicId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [timeZone, setTimeZone] = useState("UTC");
  const [durations, setDurations] = useState("30");
  const [bufferMinutes, setBufferMinutes] = useState(10);
  const [maxDaily, setMaxDaily] = useState(10);
  const [overbookingAllowed, setOverbookingAllowed] = useState(false);

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [ownerPubKeyHex, setOwnerPubKeyHex] = useState<string>("");

  const load = async () => {
    setLoading(true);
    try {
      const c = await api.listClinics({});
      setClinics(c.clinics);
      const d = await api.listDoctors({});
      setDoctors(d.doctors);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async () => {
    const parsedDurations = durations
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => requireInt(parseInt(s, 10), "appointmentDurationsMinutes[]", 5, 480));

    const data = {
      clinicId: requireString(clinicId, "clinicId", 80),
      displayName: requireString(displayName, "displayName", 80),
      specialty: requireString(specialty, "specialty", 60),
      timeZone: requireString(timeZone, "timeZone", 60),
      appointmentDurationsMinutes: parsedDurations,
      bufferMinutes: requireInt(bufferMinutes, "bufferMinutes", 0, 240),
      maxDailyAppointments: requireInt(maxDaily, "maxDailyAppointments", 1, 200),
      overbookingAllowed: !!overbookingAllowed
    };

    await api.addDoctor(data);
    setDisplayName("");
    setSpecialty("");
    await load();
  };

  const bindOwner = async () => {
    if (!selectedDoctorId) return;
    const hex = requireString(ownerPubKeyHex, "ownerPubKeyHex", 200).toLowerCase();
    await api.updateDoctor({ doctorId: selectedDoctorId, fields: { ownerPubKeyHex: hex } });
    setOwnerPubKeyHex("");
  };

  const toggleActive = async (doctorId: string, active: boolean) => {
    await api.setDoctorActive({ doctorId, active });
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          <h1 className="text-2xl font-bold">Doctors</h1>
        </div>
        <p className="mt-1 text-slate-600">Onboard doctors and bind doctor ownership to a pubkey (DoctorRole).</p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="label">Clinic</label>
            <select className="input" value={clinicId} onChange={e => setClinicId(e.target.value)}>
              <option value="">Select clinic</option>
              {clinics.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Display name</label>
            <input className="input" value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={80} />
          </div>
          <div>
            <label className="label">Specialty</label>
            <input className="input" value={specialty} onChange={e => setSpecialty(e.target.value)} maxLength={60} />
          </div>
          <div>
            <label className="label">Time zone</label>
            <input className="input" value={timeZone} onChange={e => setTimeZone(e.target.value)} maxLength={60} />
          </div>
          <div>
            <label className="label">Durations (comma)</label>
            <input className="input" value={durations} onChange={e => setDurations(e.target.value)} placeholder="15,30" />
          </div>
          <div>
            <label className="label">Buffer minutes</label>
            <input className="input" type="number" value={bufferMinutes} onChange={e => setBufferMinutes(parseInt(e.target.value || "0", 10))} />
          </div>
          <div>
            <label className="label">Max daily appointments</label>
            <input className="input" type="number" value={maxDaily} onChange={e => setMaxDaily(parseInt(e.target.value || "0", 10))} />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={overbookingAllowed} onChange={e => setOverbookingAllowed(e.target.checked)} />
              Overbooking allowed
            </label>
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full" onClick={create} disabled={loading}>
              <Plus className="h-4 w-4" /> Add Doctor
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="font-bold">Bind doctor ownership</h2>
          <p className="text-sm text-slate-600">Sets `DoctorRole(doctorId -&gt; ownerPubKeyHex)` via UpdateDoctor.</p>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <select className="input" value={selectedDoctorId} onChange={e => setSelectedDoctorId(e.target.value)}>
              <option value="">Select doctor</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.displayName} ({d.id})</option>
              ))}
            </select>
            <input className="input" value={ownerPubKeyHex} onChange={e => setOwnerPubKeyHex(e.target.value)} placeholder="doctor owner pubkey hex" />
            <button className="btn-secondary" onClick={bindOwner} disabled={!selectedDoctorId || !ownerPubKeyHex}>
              <Save className="h-4 w-4" /> Bind
            </button>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">All doctors</h2>
          <button className="btn-secondary" onClick={load}><Save className="h-4 w-4" /> Refresh</button>
        </div>
        <div className="mt-3 divide-y divide-slate-100">
          {doctors.map(d => (
            <div key={d.id} className="px-3 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{d.displayName}</p>
                <p className="text-sm text-slate-600">{d.specialty} · Clinic: {d.clinicId}</p>
                <p className="text-xs text-slate-500">{d.id}</p>
              </div>
              <button className={d.active ? "btn-secondary" : "btn-primary"} onClick={() => toggleActive(d.id, !d.active)}>
                {d.active ? "Deactivate" : "Activate"}
              </button>
            </div>
          ))}
          {!loading && doctors.length === 0 ? (
            <div className="py-10 text-center text-slate-600">No doctors yet.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
