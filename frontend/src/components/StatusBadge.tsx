import type { EventStatus, JoinMode, ParticipationStatus } from "@/api/types";
import { ClipboardCheck, Zap } from "lucide-react";
import { JOIN_MODE_LABEL, participationView } from "@/lib/status";
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

export function JoinModeBadge({ mode, className }: { mode: JoinMode; className?: string }) {
  return (
    <Tag tone="neutral" icon={JOIN_MODE_ICON[mode]} className={className}>
      {JOIN_MODE_LABEL[mode]}
    </Tag>
  );
}
