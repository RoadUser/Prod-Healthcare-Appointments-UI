import { Link } from "react-router-dom";
import { Calendar, Users, Settings } from "lucide-react";

export default function PatientHome() {
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-slate-900">Patient Portal</h1>
        <p className="mt-1 text-slate-600">Register, browse doctors, and manage your appointments.</p>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/patient/register" className="rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition">
            <div className="flex items-center gap-2 font-bold"><Settings className="h-4 w-4 text-blue-600" /> Registration</div>
            <p className="mt-2 text-sm text-slate-600">Set display name, timezone, and hashed contact.</p>
          </Link>
          <Link to="/patient/doctors" className="rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition">
            <div className="flex items-center gap-2 font-bold"><Users className="h-4 w-4 text-blue-600" /> Doctor Directory</div>
            <p className="mt-2 text-sm text-slate-600">Filter by clinic/specialty and view availability.</p>
          </Link>
          <Link to="/patient/appointments" className="rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition">
            <div className="flex items-center gap-2 font-bold"><Calendar className="h-4 w-4 text-blue-600" /> My Appointments</div>
            <p className="mt-2 text-sm text-slate-600">Cancel, reschedule, view details, export ICS.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
