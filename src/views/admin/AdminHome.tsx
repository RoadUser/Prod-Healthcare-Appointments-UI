import { Link } from "react-router-dom";
import { Home, Users, Settings, Calendar } from "lucide-react";

export default function AdminHome() {
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Admin Console</h1>
        <p className="mt-1 text-slate-600">Manage clinics, doctors, and policies.</p>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/admin/clinics" className="rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition">
            <div className="flex items-center gap-2 font-bold"><Home className="h-4 w-4 text-blue-600" /> Clinics</div>
            <p className="mt-2 text-sm text-slate-600">Create and activate/deactivate clinics.</p>
          </Link>
          <Link to="/admin/doctors" className="rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition">
            <div className="flex items-center gap-2 font-bold"><Users className="h-4 w-4 text-blue-600" /> Doctors</div>
            <p className="mt-2 text-sm text-slate-600">Onboard and manage doctor profiles.</p>
          </Link>
          <Link to="/admin/policy" className="rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition">
            <div className="flex items-center gap-2 font-bold"><Settings className="h-4 w-4 text-blue-600" /> Policy</div>
            <p className="mt-2 text-sm text-slate-600">Cancellation/reschedule rules and notes policy.</p>
          </Link>
          <Link to="/admin/analytics" className="rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition">
            <div className="flex items-center gap-2 font-bold"><Calendar className="h-4 w-4 text-blue-600" /> Analytics</div>
            <p className="mt-2 text-sm text-slate-600">Client-computed counts (contract lacks dedicated endpoints).</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
