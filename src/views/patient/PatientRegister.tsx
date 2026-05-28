import { useMemo, useState } from "react";
import { ApiService } from "@/services/api-service";
import { sha256Hex } from "@/utils/crypto";
import { requireString } from "@/utils/validators";
import { useAppDispatch } from "@/app/hooks";
import { snackbarActions } from "@/features/snackbar/snackbarSlice";
import { Save, CircleAlert } from "lucide-react";

function uid() {
  const b = new Uint8Array(10);
  crypto.getRandomValues(b);
  return Array.from(b).map(x => x.toString(16).padStart(2, "0")).join("");
}

export default function PatientRegister() {
  const api = useMemo(() => ApiService.getInstance(), []);
  const dispatch = useAppDispatch();

  const [displayName, setDisplayName] = useState("");
  const [timeZone, setTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    try {
      const dn = requireString(displayName, "displayName", 80);
      const tz = requireString(timeZone, "timeZone", 60);
      const contactRaw = requireString(contact, "contact", 200);
      setBusy(true);
      const contactHash = await sha256Hex(contactRaw);
      const res = await api.registerPatient({ displayName: dn, timeZone: tz, contactHash, preferences: { locale: navigator.language } });
      dispatch(snackbarActions.push({ id: uid(), kind: "success", title: "Registered", message: `Patient id: ${res.patient.id}` }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Registration failed";
      setError(msg);
      dispatch(snackbarActions.push({ id: uid(), kind: "error", title: "Registration failed", message: msg }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-slate-900">Patient Registration</h1>
        <p className="mt-1 text-slate-600">Contact is SHA-256 hashed client-side before sending to the contract.</p>

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800 text-sm flex gap-2">
            <CircleAlert className="h-4 w-4 mt-0.5" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="mt-5 space-y-4">
          <div>
            <label className="label" htmlFor="displayName">Display name</label>
            <input id="displayName" className="input" value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={80} />
          </div>

          <div>
            <label className="label" htmlFor="timeZone">Time zone</label>
            <input id="timeZone" className="input" value={timeZone} onChange={e => setTimeZone(e.target.value)} maxLength={60} />
            <p className="hint mt-1">Suggested: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
          </div>

          <div>
            <label className="label" htmlFor="contact">Contact (email/phone hash input)</label>
            <input id="contact" className="input" value={contact} onChange={e => setContact(e.target.value)} maxLength={200} placeholder="e.g., patient@example.com" />
            <p className="hint mt-1">Never stored or sent raw—only its SHA-256 hash is sent.</p>
          </div>

          <button className="btn-primary w-full" onClick={submit} disabled={busy}>
            <Save className="h-4 w-4" />
            {busy ? "Saving..." : "Register / Update"}
          </button>
        </div>
      </div>
    </div>
  );
}
