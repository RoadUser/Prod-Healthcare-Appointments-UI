import { useEffect, useMemo, useState } from "react";
import { ApiService } from "@/services/api-service";
import { requireString } from "@/utils/validators";
import { Plus, Save } from "lucide-react";

export default function AdminClinics() {
  const api = useMemo(() => ApiService.getInstance(), []);
  const [loading, setLoading] = useState(false);
  const [clinics, setClinics] = useState<any[]>([]);
  const [name, setName] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.listClinics({});
      setClinics(res.clinics);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async () => {
    const n = requireString(name, "name", 100);
    await api.createClinic({ name: n });
    setName("");
    await load();
  };

  const toggle = async (id: string, active: boolean) => {
    await api.setClinicActive({ clinicId: id, active });
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Clinics</h1>
        <p className="mt-1 text-slate-600">Create and activate/deactivate clinics.</p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Clinic name" maxLength={100} />
          <button className="btn-primary" onClick={create} disabled={loading}>
            <Plus className="h-4 w-4" /> Create
          </button>
          <button className="btn-secondary" onClick={load} disabled={loading}>
            <Save className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="divide-y divide-slate-100">
          {clinics.map(c => (
            <div key={c.id} className="px-3 py-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">{c.name}</p>
                <p className="text-xs text-slate-500">{c.id}</p>
              </div>
              <button className={c.active ? "btn-secondary" : "btn-primary"} onClick={() => toggle(c.id, !c.active)}>
                {c.active ? "Deactivate" : "Activate"}
              </button>
            </div>
          ))}
          {!loading && clinics.length === 0 ? (
            <div className="py-10 text-center text-slate-600">No clinics yet.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
