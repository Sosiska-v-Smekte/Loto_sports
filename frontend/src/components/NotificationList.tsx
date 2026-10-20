import {
  AlarmClock,
  Ban,
  BellOff,
  Building2,
  ClipboardCheck,
  Inbox,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { AppNotification, NotificationType } from "@/api/types";
import { useMarkAllRead, useMarkRead, useNotifications } from "@/features/notifications";
import { cn } from "@/lib/cn";
import { formatRelative, formatShortDate } from "@/lib/dates";
import { Button } from "./ui/Button";
import { Skeleton } from "./ui/Skeleton";
import { ErrorState } from "./ui/States";

const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  reminder: AlarmClock,
  reply: MessageCircle,
  participation_decision: ClipboardCheck,
  organization_review: Building2,
  organization_request: Inbox,
  event_unpublished: Ban,
};

interface NotificationListProps {
  /** Вызывается после перехода по уведомлению — чтобы закрыть выпадающее меню */
  onNavigate?: () => void;
  limit?: number;
  /** Заголовок «Уведомления» нужен в выпадающем меню; на отдельной странице он уже есть */
  showTitle?: boolean;
  className?: string;
}

/** Список уведомлений: клик помечает прочитанным и ведёт на нужный экран. */
export function NotificationList({ onNavigate, limit, showTitle = false, className }: NotificationListProps) {
  const notifications = useNotifications();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const navigate = useNavigate();

  const open = (item: AppNotification) => {
    if (!item.is_read) markRead.mutate(item.id);
    onNavigate?.();
    if (item.link) navigate(item.link);
  };

  const items = limit ? notifications.data?.slice(0, limit) : notifications.data;
  const hasUnread = notifications.data?.some((n) => !n.is_read);

  return (
    <div className={className}>
      <div className={cn("flex items-center gap-3 px-1 pb-2", showTitle ? "justify-between" : "justify-end")}>
        {showTitle && <p className="font-semibold">Уведомления</p>}
        <Button
          size="sm"
          variant="ghost"
          className="!min-h-10 !px-3 text-primary"
          disabled={!hasUnread}
          loading={markAll.isPending}
          onClick={() => markAll.mutate()}
        >
          Прочитать все
        </Button>
      </div>
      {notifications.isPending && (
        <div className="space-y-2" aria-hidden>
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      )}
      {notifications.isError && <ErrorState error={notifications.error} onRetry={() => notifications.refetch()} />}
      {items?.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-muted">
          <BellOff className="size-7" aria-hidden />
          Уведомлений пока нет
        </div>
      )}
      {items && items.length > 0 && (
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const Icon = TYPE_ICON[item.type] ?? Inbox;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => open(item)}
                  className={cn(
                    "pressable flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left hover:bg-surface-muted",
                    !item.is_read && "bg-primary-soft/60",
                  )}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-level">
                    <Icon className="size-[18px]" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block leading-snug", !item.is_read && "font-semibold")}>{item.title}</span>
                    {item.body && <span className="mt-0.5 block text-sm leading-snug text-muted">{item.body}</span>}
                    <time dateTime={item.created_at} title={formatShortDate(item.created_at)} className="mt-1 block text-xs text-muted">
                      {formatRelative(item.created_at)}
                    </time>
                  </span>
                  {!item.is_read && <span className="mt-2 size-2.5 shrink-0 rounded-full bg-primary" aria-label="не прочитано" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
