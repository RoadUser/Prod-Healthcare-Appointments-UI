import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { snackbarActions } from "@/features/snackbar/snackbarSlice";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { cn } from "@/utils/cn";

export default function Snackbar() {
  const items = useAppSelector(s => s.snackbar?.items ?? []);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!items.length) return;
    const t = window.setTimeout(() => {
      const last = items[items.length - 1];
      if (last) dispatch(snackbarActions.remove(last.id));
    }, 5000);
    return () => window.clearTimeout(t);
  }, [items, dispatch]);

  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="fixed bottom-4 right-4 z-50 flex w-[min(92vw,420px)] flex-col gap-2"
    >
      {items.map(i => {
        const Icon = i.kind === "success" ? CircleCheck : i.kind === "error" ? CircleAlert : Info;
        return (
          <div
            key={i.id}
            role="status"
            className={cn(
              "card p-4 shadow-lg",
              i.kind === "success" && "border-emerald-200",
              i.kind === "error" && "border-rose-200"
            )}
          >
            <div className="flex items-start gap-3">
              <Icon className={cn("h-5 w-5 mt-0.5", i.kind === "success" ? "text-emerald-600" : i.kind === "error" ? "text-rose-600" : "text-blue-600")} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{i.title}</p>
                {i.message ? <p className="mt-1 text-sm text-slate-600 break-words">{i.message}</p> : null}
              </div>
              <button
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                aria-label="Dismiss notification"
                onClick={() => dispatch(snackbarActions.remove(i.id))}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
