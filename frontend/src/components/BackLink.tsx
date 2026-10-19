import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export function BackLink({ to = "/", label = "К поиску активностей" }: { to?: string; label?: string }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-11 items-center gap-2 rounded-full pr-3 font-medium text-muted hover:text-ink"
    >
      <ArrowLeft className="size-5" aria-hidden />
      {label}
    </Link>
  );
}
