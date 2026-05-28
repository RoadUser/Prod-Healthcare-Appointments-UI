import { Link } from "react-router-dom";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-900">404</h1>
        <p className="mt-3 text-lg text-slate-600">Page not found</p>
        <Link to="/" className="btn-primary mt-6 inline-flex">
          <Home className="h-4 w-4" />
          Go Home
        </Link>
      </div>
    </div>
  );
}
