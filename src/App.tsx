import { useEffect, useMemo, useState } from "react";
import AppRoutes from "@/routes/routes";
import Snackbar from "@/Components/Shared/Snackbar";
import Loading from "@/Components/Shared/Loading";
import { ContractService } from "@/services/contract-service";
import { useAppDispatch } from "@/app/hooks";
import { authActions } from "@/features/auth/authSlice";
import { snackbarActions } from "@/features/snackbar/snackbarSlice";
import { eventsActions } from "@/features/events/eventsSlice";
import { ApiService } from "@/services/api-service";

function uid() {
  const b = new Uint8Array(10);
  crypto.getRandomValues(b);
  return Array.from(b).map(x => x.toString(16).padStart(2, "0")).join("");
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useAppDispatch();

  const cs = useMemo(() => ContractService.getInstance(), []);

  useEffect(() => {
    const init = async () => {
      try {
        await cs.init();
        const pubKeyHex = cs.getLinkedPubKeyHex();

        // restore session
        const session = cs.getSession();
        dispatch(
          authActions.setIdentity({
            pubKeyHex,
            role: session?.role ?? ((import.meta.env.VITE_DEFAULT_PORTAL as any) || "patient"),
            doctorId: session?.doctorId
          })
        );

        // Subscribe to outputs for realtime events
        cs.onOutput((msg: any) => {
          // contract emits {event, data}
          if (msg && typeof msg === "object" && "event" in msg) {
            const type = String((msg as any).event);
            const data = (msg as any).data;
            dispatch(eventsActions.pushEvent({ id: uid(), type, ts: new Date().toISOString(), data }));
            // subtle user feedback
            dispatch(
              snackbarActions.push({
                id: uid(),
                kind: "info",
                title: "Contract event",
                message: `${type}`
              })
            );

            // Refresh key views depending on event
            if (
              [
                "AppointmentBooked",
                "AppointmentCancelled",
                "AppointmentRescheduled",
                "AppointmentCompleted",
                "AppointmentNoShow"
              ].includes(type)
            ) {
              // best-effort refresh patient appointments
              void (async () => {
                try {
                  const api = ApiService.getInstance();
                  const start = new Date(Date.now() - 7 * 86400000).toISOString();
                  const end = new Date(Date.now() + 60 * 86400000).toISOString();
                  await api.listAppointmentsByPatient({ startDateUtc: start, endDateUtc: end });
                } catch {
                  // ignore
                }
              })();
            }

            return;
          }

          // If a response-like object with error
          if (msg && typeof msg === "object" && "error" in msg) {
            dispatch(
              snackbarActions.push({
                id: uid(),
                kind: "error",
                title: "Contract error",
                message: JSON.stringify((msg as any).error)
              })
            );
          }
        });

        dispatch(authActions.setInitialized(true));
        setReady(true);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to initialize";
        setError(msg);
        dispatch(
          snackbarActions.push({
            id: uid(),
            kind: "error",
            title: "Initialization failed",
            message: msg
          })
        );
      }
    };

    void init();
  }, [cs, dispatch]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <div className="card p-6">
            <h1 className="text-2xl font-bold text-slate-900">CareSchedule</h1>
            <p className="mt-2 text-slate-600">Failed to initialize HotPocket connection.</p>
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {error}
            </div>
            <p className="mt-4 text-sm text-slate-600">
              Fix:
              <ul className="list-disc pl-5 mt-1">
                <li>Set <span className="font-mono">VITE_MOCK_MODE=true</span> for development, or</li>
                <li>Configure valid <span className="font-mono">VITE_CONTRACT_URLS</span> (wss://) and ensure the node is reachable.</li>
              </ul>
            </p>
          </div>
        </div>
        <Snackbar />
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <Loading label="Connecting to contract..." />
      </div>
    );
  }

  return (
    <>
      <AppRoutes />
      <Snackbar />
    </>
  );
}
