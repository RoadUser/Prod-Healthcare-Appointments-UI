import { useEffect, useMemo, useState } from "react";
import { ApiService } from "@/services/api-service";
import { requireInt } from "@/utils/validators";
import { Save } from "lucide-react";

export default function AdminPolicy() {
  const api = useMemo(() => ApiService.getInstance(), []);

  const [loading, setLoading] = useState(false);
  const [cancellationWindowMinutes, setCancellation] = useState(60);
  const [rescheduleWindowMinutes, setReschedule] = useState(120);
  const [allowPatientNotes, setAllowNotes] = useState(true);
  const [overbookReasonCodes, setOverbookReasonCodes] = useState("EMERGENCY");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const p = await api.getPolicy();
        setCancellation(p.cancellationWindowMinutes);
        setReschedule(p.rescheduleWindowMinutes);
        setAllowNotes(p.allowPatientNotes);
        setOverbookReasonCodes(p.overbookReasonCodes.join(","));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [api]);

  const save = async () => {
    const codes = overbookReasonCodes
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 50);

    await api.setPolicy({
      cancellationWindowMinutes: requireInt(cancellationWindowMinutes, "cancellationWindowMinutes", 0, 10080),
      rescheduleWindowMinutes: requireInt(rescheduleWindowMinutes, "rescheduleWindowMinutes", 0, 10080),
      allowPatientNotes: !!allowPatientNotes,
      overbookReasonCodes: codes
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Policy</h1>
        <p className="mt-1 text-slate-600">Sets cancellation/reschedule windows and notes policy.</p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="label">Cancellation window (minutes)</label>
            <input className="input" type="number" value={cancellationWindowMinutes} onChange={e => setCancellation(parseInt(e.target.value || "0", 10))} />
          </div>
          <div>
            <label className="label">Reschedule window (minutes)</label>
            <input className="input" type="number" value={rescheduleWindowMinutes} onChange={e => setReschedule(parseInt(e.target.value || "0", 10))} />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={allowPatientNotes} onChange={e => setAllowNotes(e.target.checked)} />
              Allow patient notes
            </label>
          </div>
          <div>
            <label className="label">Overbook reason codes (comma)</label>
            <input className="input" value={overbookReasonCodes} onChange={e => setOverbookReasonCodes(e.target.value)} />
            <p className="hint mt-1">Must match pattern: letters/numbers/_-., max 32 each.</p>
          </div>
          <button className="btn-primary" onClick={save} disabled={loading}>
            <Save className="h-4 w-4" /> Save policy
          </button>
        </div>
      </div>
    </div>
  );
}
