import type { EventStatus, ParticipationStatus } from "@/api/types";
import { ClipboardCheck, Zap } from "lucide-react";
import { participationView } from "@/lib/status";
import { Tag } from "./ui/Tag";

interface StatusBadgeProps {
  status: ParticipationStatus;
  eventStatus: EventStatus;
  size?: "sm" | "md";
  className?: string;
}

/** Статус записи: цвет + иконка + текст, чтобы не полагаться только на цвет. */
export function StatusBadge({ status, eventStatus, size, className }: StatusBadgeProps) {
  const view = participationView(status, eventStatus);
  return (
    <Tag tone={view.tone} icon={view.icon} size={size} className={className}>
      {view.label}
    </Tag>
  );
}

export const JOIN_MODE_ICON = { open: Zap, approval: ClipboardCheck } as const;
