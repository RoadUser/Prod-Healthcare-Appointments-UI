import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ApiService } from "@/services/api-service";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { clinicsActions } from "@/features/clinics/clinicsSlice";
import { doctorsActions } from "@/features/doctors/doctorsSlice";
import { snackbarActions } from "@/features/snackbar/snackbarSlice";
import Loading from "@/Components/Shared/Loading";
import { Search, Calendar } from "lucide-react";

function uid() {
  const b = new Uint8Array(10);
  crypto.getRandomValues(b);
  return Array.from(b).map(x => x.toString(16).padStart(2, "0")).join("");
}

export default function PatientDoctors() {
  const api = useMemo(() => ApiService.getInstance(), []);
  const dispatch = useAppDispatch();

  const clinics = useAppSelector(s => s.clinics?.clinics ?? []);
  const doctors = useAppSelector(s => s.doctors?.doctors ?? []);
  const loading = useAppSelector(s => (s.doctors?.loading ?? false) || (s.clinics?.loading ?? false));

  const [clinicId, setClinicId] = useState<string>("");
  const [specialty, setSpecialty] = useState<string>("");
  const [activeOnly, setActiveOnly] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      dispatch(clinicsActions.setLoading(true));
      dispatch(doctorsActions.setLoading(true));
      try {
        const c = await api.listClinics({ active: true });
        dispatch(clinicsActions.setClinics(c.clinics));
        const d = await api.listDoctors({ active: true });
        dispatch(doctorsActions.setDoctors(d.doctors));
      } catch (e) {
        dispatch(snackbarActions.push({ id: uid(), kind: "error", title: "Load failed", message: e instanceof Error ? e.message : "Unknown" }));
      } finally {
        dispatch(clinicsActions.setLoading(false));
        dispatch(doctorsActions.setLoading(false));
      }
    };
    void load();
  }, [api, dispatch]);

  const applyFilters = async () => {
    dispatch(doctorsActions.setLoading(true));
    try {
      const d = await api.listDoctors({
        clinicId: clinicId || undefined,
        specialty: specialty || undefined,
        active: activeOnly
      });
      dispatch(doctorsActions.setDoctors(d.doctors));
    } catch (e) {
      dispatch(snackbarActions.push({ id: uid(), kind: "error", title: "Search failed", message: e instanceof Error ? e.message : "Unknown" }));
    } finally {
      dispatch(doctorsActions.setLoading(false));
    }
  };

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Doctor Directory</h1>
        <p className="mt-1 text-slate-600">Filter by clinic and specialty. Availability is computed by the contract.</p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="label" htmlFor="clinic">Clinic</label>
            <select id="clinic" className="input" value={clinicId} onChange={e => setClinicId(e.target.value)}>
              <option value="">All</option>
              {clinics.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="specialty">Specialty</label>
            <input id="specialty" className="input" value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="e.g., Cardiology" maxLength={60} />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)} />
              Active only
            </label>
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full" onClick={applyFilters}>
              <Search className="h-4 w-4" />
              Search
            </button>
          </div>
        </div>
      </div>

      {loading ? <Loading /> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {doctors.map(d => (
          <div key={d.id} className="card p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-bold text-slate-900">{d.displayName}</h2>
                <p className="text-sm text-slate-600">{d.specialty}</p>
                <p className="text-xs text-slate-500 mt-1">Durations: {d.appointmentDurationsMinutes.join(", ")} min · Buffer: {d.bufferMinutes} min</p>
              </div>
              <span className={d.active ? "rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold" : "rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-bold"}>
                {d.active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="mt-4">
              <Link to={`/patient/doctors/${d.id}`} className="btn-secondary w-full">
                <Calendar className="h-4 w-4" />
                View Availability
              </Link>
            </div>
          </div>
        ))}

        {!loading && doctors.length === 0 ? (
          <div className="col-span-full text-center text-slate-600 py-12">
            No doctors match your filters.
          </div>
        ) : null}
      </div>
    </div>
  );
}
