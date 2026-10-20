import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { TONE_CLASS, type Tone } from "@/lib/status";

interface NoticeProps {
  tone: Tone;
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function Notice({ tone, icon: Icon, title, children, action, className }: NoticeProps) {
  return (
    <div data-tone={tone} className={cn("flex flex-col gap-3 rounded-[20px] p-4 sm:flex-row sm:items-center sm:p-5", TONE_CLASS[tone], className)}>
      <Icon className="size-6 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        {children && <div className="mt-1 opacity-90">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
