import { Lightbulb } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Видны только в простом режиме (data-simple-only, см. accessibility.css). */

export function SimpleStep({ n, title, children, className }: { n: number; title: string; children?: ReactNode; className?: string }) {
  return (
    <div data-simple-only className={cn("items-start gap-3", className)}>
      <span className="neu-primary grid size-11 shrink-0 place-items-center rounded-full bg-primary text-xl font-bold text-white" aria-hidden>
        {n}
      </span>
      <div className="min-w-0">
        <h2 className="text-[22px] font-semibold leading-tight">
          <span className="sr-only">Шаг {n}. </span>
          {title}
        </h2>
        {children && <p className="mt-1 text-[17px] leading-snug text-muted">{children}</p>}
      </div>
    </div>
  );
}

export function SimpleHint({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <aside data-simple-only aria-label="Подсказка" className={cn("items-start gap-3 rounded-2xl bg-primary-soft p-4", className)}>
      <Lightbulb className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0 text-[17px] leading-snug">
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? "mt-1" : undefined}>{children}</div>
      </div>
    </aside>
  );
}
