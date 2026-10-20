import { Ban, CheckCircle2, Clock, EyeOff, Trash2, XCircle, type LucideIcon } from "lucide-react";
import type { EventStatus, JoinMode, Level, OrganizationStatus, ParticipationStatus, SportLevel } from "@/api/types";

export type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "level";

export interface StatusView {
  label: string;
  tone: Tone;
  icon: LucideIcon;
}

export const LEVEL_LABEL: Record<Level, string> = {
  any: "Можно без опыта",
  beginner: "Для новичков",
  amateur: "Для игроков",
  pro: "Для опытных",
};

export const LEVEL_HINT: Record<Level, string> = {
  any: "Подойдёт, даже если вы никогда не пробовали",
  beginner: "Нужны самые базовые навыки",
  amateur: "Для тех, кто уже регулярно играет",
  pro: "Высокий уровень подготовки",
};

export const SPORT_LEVEL_LABEL: Record<SportLevel, string> = {
  beginner: "Начинающий",
  amateur: "Любитель",
  pro: "Опытный",
};

export const organizerKind = (event: { organization: unknown }) => (event.organization ? "Организация" : "Частное лицо");

export const JOIN_MODE_LABEL: Record<JoinMode, string> = {
  open: "Свободная запись",
  approval: "По заявке",
};

export const JOIN_MODE_HINT: Record<JoinMode, string> = {
  open: "Нажимаете «Записаться» — и вы сразу в списке участников.",
  approval: "Вы отправляете заявку, организатор её рассматривает и принимает или отклоняет.",
};

const PARTICIPATION: Record<ParticipationStatus, StatusView> = {
  confirmed: { label: "Вы записаны", tone: "success", icon: CheckCircle2 },
  pending: { label: "Заявка на рассмотрении", tone: "warning", icon: Clock },
  rejected: { label: "Заявка отклонена", tone: "danger", icon: XCircle },
};

const EVENT_REMOVED: StatusView = { label: "Мероприятие снято", tone: "neutral", icon: Ban };
const EVENT_DELETED: StatusView = { label: "Мероприятие удалено", tone: "neutral", icon: Trash2 };

/** Снятое или удалённое событие важнее статуса заявки. */
export function participationView(status: ParticipationStatus, eventStatus: EventStatus): StatusView {
  if (eventStatus === "deleted") return EVENT_DELETED;
  return eventStatus === "published" ? PARTICIPATION[status] : EVENT_REMOVED;
}

export const isOutdatedParticipation = (status: ParticipationStatus, eventStatus: EventStatus) =>
  status === "rejected" || eventStatus !== "published";

export const ORGANIZATION_STATUS: Record<OrganizationStatus, StatusView> = {
  pending: { label: "Заявка на рассмотрении", tone: "warning", icon: Clock },
  approved: { label: "Одобрена", tone: "success", icon: CheckCircle2 },
  rejected: { label: "Заявка отклонена", tone: "danger", icon: XCircle },
};

export const EVENT_STATUS: Record<EventStatus, StatusView> = {
  published: { label: "Опубликовано", tone: "success", icon: CheckCircle2 },
  unpublished: { label: "Снято с публикации", tone: "neutral", icon: EyeOff },
  deleted: { label: "Удалено", tone: "danger", icon: Trash2 },
};

export const TONE_CLASS: Record<Tone, string> = {
  success: "bg-success text-success-ink",
  warning: "bg-warning text-warning-ink",
  danger: "bg-danger text-danger-ink",
  info: "bg-info text-info-ink",
  neutral: "bg-line text-ink",
  level: "bg-level text-ink",
};
