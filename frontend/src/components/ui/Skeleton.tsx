import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-[#e9e0cf]", className)} aria-hidden />;
}

export function LoadingBlock({ label = "Загружаем…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)} role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-5/6" />
      <Skeleton className="h-40 w-full rounded-card" />
    </div>
  );
}
