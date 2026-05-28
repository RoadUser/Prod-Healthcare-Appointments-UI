import type { AppointmentStatus } from "@/types";
import { cn } from "@/utils/cn";

export default function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const cls =
    status === "BOOKED"
      ? "bg-blue-100 text-blue-800"
      : status === "COMPLETED"
      ? "bg-emerald-100 text-emerald-800"
      : status === "NO_SHOW"
      ? "bg-amber-100 text-amber-900"
      : "bg-slate-100 text-slate-700";

  return <span className={cn("rounded-full px-3 py-1 text-xs font-bold", cls)}>{status}</span>;
}
