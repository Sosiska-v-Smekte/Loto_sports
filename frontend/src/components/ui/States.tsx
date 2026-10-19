import { AlertTriangle, RotateCw, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { errorMessage } from "@/api/client";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  text?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, text, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-card border border-dashed border-line bg-surface/70 px-6 py-10 text-center",
        className,
      )}
    >
      <span className="grid size-14 place-items-center rounded-full bg-level">
        <Icon className="size-7 text-ink" aria-hidden />
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
      {text && <p className="max-w-md text-muted">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, className }: { error: unknown; onRetry?: () => void; className?: string }) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 rounded-card border border-danger bg-[#fbeeeb] px-6 py-8 text-center",
        className,
      )}
    >
      <AlertTriangle className="size-8 text-danger-ink" aria-hidden />
      <p className="font-medium">Не удалось загрузить данные</p>
      <p className="max-w-md text-muted">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} icon={<RotateCw className="size-4" aria-hidden />}>
          Повторить
        </Button>
      )}
    </div>
  );
}
