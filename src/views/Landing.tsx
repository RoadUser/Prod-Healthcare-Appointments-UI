import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ContractService, SessionRole } from "@/services/contract-service";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { authActions } from "@/features/auth/authSlice";
import { snackbarActions } from "@/features/snackbar/snackbarSlice";
import { Shield, Users, User, ArrowRight, Key } from "lucide-react";

function uid() {
  const b = new Uint8Array(10);
  crypto.getRandomValues(b);
  return Array.from(b).map(x => x.toString(16).padStart(2, "0")).join("");
}

export default function Landing() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const pubKeyHex = useAppSelector(s => s.auth?.pubKeyHex ?? "");
  const currentRole = useAppSelector(s => s.auth?.role ?? "patient");
  const cs = useMemo(() => ContractService.getInstance(), []);

  const [role, setRole] = useState<SessionRole>(currentRole);
  const [doctorId, setDoctorId] = useState<string>(cs.getSession()?.doctorId || "");

  const link = async () => {
    try {
      const linked = cs.getLinkedPubKeyHex();
      if (!linked) throw new Error("No identity available.");
      cs.setSession({ role, doctorId: role === "doctor" ? doctorId.trim() : undefined, linkedPubKeyHex: linked });
      dispatch(authActions.setIdentity({ pubKeyHex: linked, role, doctorId: role === "doctor" ? doctorId.trim() : undefined }));
      dispatch(snackbarActions.push({ id: uid(), kind: "success", title: "Identity linked", message: "Session saved on this device." }));

      navigate(role === "admin" ? "/admin" : role === "doctor" ? "/doctor" : "/patient");
    } catch (e) {
      dispatch(snackbarActions.push({ id: uid(), kind: "error", title: "Link failed", message: e instanceof Error ? e.message : "Unknown" }));
    }
  };

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <p className="text-blue-100 text-sm font-semibold">Decentralized appointment scheduling</p>
          <h1 className="mt-2 text-3xl font-bold">Welcome to CareSchedule</h1>
          <p className="mt-2 text-blue-100 max-w-2xl">
            Choose a portal and link this browser session to your HotPocket identity.
            All contract calls are signed using your local HotPocket keypair.
          </p>
        </div>
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <h2 className="font-bold text-slate-900">Patient Portal</h2>
            </div>
            <p className="mt-2 text-sm text-slate-600">Register, browse doctors, book and manage appointments.</p>
            <button className="btn-secondary mt-4 w-full" onClick={() => setRole("patient")}>Select</button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h2 className="font-bold text-slate-900">Doctor Portal</h2>
            </div>
            <p className="mt-2 text-sm text-slate-600">View schedule, block time, and manage appointment outcomes.</p>
            <button className="btn-secondary mt-4 w-full" onClick={() => setRole("doctor")}>Select</button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <h2 className="font-bold text-slate-900">Admin Console</h2>
            </div>
            <p className="mt-2 text-sm text-slate-600">Manage clinics, doctors, policies, and system insights.</p>
            <button className="btn-secondary mt-4 w-full" onClick={() => setRole("admin")}>Select</button>
          </div>
        </div>
      </section>

      <section className="card p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Link session</h2>
            <p className="text-sm text-slate-600">Your identity (pubkey hex) is stored locally. No passwords.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-500">Detected pubkey</p>
            <p className="font-mono text-xs text-slate-800 max-w-[540px] truncate">{pubKeyHex || "(not available)"}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="role">Portal role</label>
            <select id="role" className="input" value={role} onChange={e => setRole(e.target.value as any)}>
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="admin">Admin</option>
            </select>
            <p className="hint mt-1">Doctor portal requires `doctorId` binding in the contract (Admin: UpdateDoctor.ownerPubKeyHex).</p>
          </div>

          <div>
            <label className="label" htmlFor="doctorId">Doctor ID (only for Doctor role)</label>
            <input
              id="doctorId"
              className="input"
              value={doctorId}
              onChange={e => setDoctorId(e.target.value)}
              placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
              disabled={role !== "doctor"}
            />
            <p className="hint mt-1">Must match the doctorId the admin assigned to your pubkey.</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <button className="btn-primary" onClick={link}>
            <Key className="h-4 w-4" />
            Link & Continue
            <ArrowRight className="h-4 w-4" />
          </button>
          <button className="btn-secondary" onClick={() => navigate("/patient/register")}>Patient Registration</button>
        </div>
      </section>
    </div>
  );
}
