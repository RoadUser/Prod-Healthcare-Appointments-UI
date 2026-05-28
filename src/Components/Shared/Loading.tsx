import { Loader2 } from "lucide-react";

export default function Loading({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-600" />
        <p className="mt-3 text-sm text-slate-600">{label || "Loading..."}</p>
      </div>
    </div>
  );
}
