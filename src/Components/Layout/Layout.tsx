import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { cn } from "@/utils/cn";
import { Home, Users, Settings, LogOut, Calendar, Shield } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { ContractService } from "@/services/contract-service";
import { authActions } from "@/features/auth/authSlice";

const navBase = "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition";

export default function Layout() {
  const role = useAppSelector(s => s.auth?.role ?? "patient");
  const pubKeyHex = useAppSelector(s => s.auth?.pubKeyHex ?? "");
  const doctorId = useAppSelector(s => s.auth?.doctorId);
  const dispatch = useAppDispatch();
  const nav = useNavigate();

  const links = useMemo(() => {
    if (role === "admin") {
      return [
        { to: "/admin", label: "Admin", icon: Shield },
        { to: "/admin/clinics", label: "Clinics", icon: Home },
        { to: "/admin/doctors", label: "Doctors", icon: Users },
        { to: "/admin/policy", label: "Policy", icon: Settings },
        { to: "/admin/analytics", label: "Analytics", icon: Calendar },
        { to: "/admin/audit", label: "Audit", icon: Settings }
      ];
    }
    if (role === "doctor") {
      return [
        { to: "/doctor", label: "Dashboard", icon: Home },
        { to: "/doctor/schedule", label: "Schedule", icon: Calendar },
        { to: "/doctor/settings", label: "Settings", icon: Settings }
      ];
    }
    return [
      { to: "/patient", label: "Home", icon: Home },
      { to: "/patient/doctors", label: "Doctors", icon: Users },
      { to: "/patient/appointments", label: "Appointments", icon: Calendar },
      { to: "/patient/notifications", label: "Notifications", icon: Settings }
    ];
  }, [role]);

  const logout = () => {
    const cs = ContractService.getInstance();
    cs.clearSession();
    dispatch(authActions.setIdentity({ pubKeyHex, role: "patient" }));
    nav("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="CareSchedule" className="h-9 w-9" />
            <div>
              <p className="text-sm font-bold text-slate-900">CareSchedule</p>
              <p className="text-xs text-slate-500">Role: {role}{role === "doctor" && doctorId ? ` (${doctorId})` : ""}</p>
            </div>
          </div>
          <div className="hidden md:block">
            <p className="text-xs text-slate-500">Identity</p>
            <p className="font-mono text-xs text-slate-700 truncate max-w-[360px]">{pubKeyHex || "Not linked"}</p>
          </div>
          <button className="btn-secondary" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
        <nav className="mx-auto max-w-7xl px-4 pb-3">
          <div className="flex flex-wrap gap-2">
            {links.map(l => {
              const Icon = l.icon;
              return (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    cn(
                      navBase,
                      isActive ? "bg-blue-600 text-white" : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {l.label}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6">
        <Outlet />
      </main>

      <footer className="bg-slate-100 py-6 text-center text-slate-600 text-sm border-t border-slate-200">
        © {new Date().getFullYear()} CareSchedule. All rights reserved.
      </footer>
    </div>
  );
}
