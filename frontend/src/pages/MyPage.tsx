import { CalendarDays, CalendarPlus, Clock, MapPin, Search, UsersRound, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { meApi } from "@/api/endpoints";
import type { MyParticipation, SportEvent } from "@/api/types";
import { SportIllustration } from "@/components/SportIllustration";
import { StatusBadge } from "@/components/StatusBadge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Tabs } from "@/components/ui/Tabs";
import { Tag } from "@/components/ui/Tag";
import { useColorSafe } from "@/features/accessibility";
import { useAction } from "@/features/action";
import { useMyEvents, useMyParticipations } from "@/features/me";
import { eventPalette } from "@/lib/color";
import { formatEventDate } from "@/lib/dates";
import { EVENT_STATUS, isOutdatedParticipation } from "@/lib/status";

type Tab = "joined" | "organized";

export function MyPage() {
  const [tab, setTab] = useState<Tab>("joined");
  const joined = useMyParticipations();
  const organized = useMyEvents();
  const active = tab === "joined" ? joined : organized;
  const [removing, setRemoving] = useState<MyParticipation | null>(null);
  const hide = useAction((id: number) => meApi.hideParticipation(id), "Запись убрана из списка");

  return (
    <div className="page-container max-w-4xl pt-6 lg:pt-10">
      <h1 className="text-[30px] font-bold leading-tight sm:text-[40px]">Мои активности</h1>
      <Tabs
        className="mt-5"
        label="Мои активности"
        value={tab}
        onChange={setTab}
        items={[
          { value: "joined", label: "Я участвую", count: joined.data?.length },
          { value: "organized", label: "Я организую", count: organized.data?.length },
        ]}
      />
      <div className="mt-5 flex flex-col gap-3">
        {active.isPending && Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-28 rounded-card" />)}
        {active.isError && <ErrorState error={active.error} onRetry={() => active.refetch()} />}

        {tab === "joined" &&
          joined.data &&
          (joined.data.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Вы пока никуда не записаны"
              text="Найдите активность по душе и присоединяйтесь."
              action={<ButtonLink to="/">Найти активность</ButtonLink>}
            />
          ) : (
            joined.data.map((p) => (
              <EventRow
                key={p.id}
                event={p.event}
                action={
                  isOutdatedParticipation(p.status, p.event.status) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted"
                      icon={<X className="size-4" aria-hidden />}
                      onClick={() => setRemoving(p)}
                    >
                      Убрать из списка
                    </Button>
                  )
                }
              >
                <StatusBadge status={p.status} eventStatus={p.event.status} />
                {p.event.status !== "published" && p.event.moderation_reason && (
                  <p className="w-full text-sm text-muted">Причина: {p.event.moderation_reason}</p>
                )}
              </EventRow>
            ))
          ))}

        {tab === "organized" &&
          organized.data &&
          (organized.data.length === 0 ? (
            <EmptyState
              icon={CalendarPlus}
              title="Вы ещё ничего не организовали"
              text="Создайте активность — это займёт пару минут."
              action={<ButtonLink to="/events/new">Создать активность</ButtonLink>}
            />
          ) : (
            organized.data.map((event) => {
              const status = EVENT_STATUS[event.status];
              return (
                <EventRow key={event.id} event={event}>
                  <Tag tone="success" icon={UsersRound}>
                    Участников: {event.participants_count}
                  </Tag>
                  {Boolean(event.pending_count) && (
                    <Tag tone="warning" icon={Clock}>
                      Ждут ответа: {event.pending_count}
                    </Tag>
                  )}
                  {event.status !== "published" && (
                    <>
                      <Tag tone={status.tone} icon={status.icon}>
                        {status.label}
                      </Tag>
                      {event.moderation_reason && (
                        <p className="w-full text-sm font-medium text-danger-ink">Причина: {event.moderation_reason}</p>
                      )}
                    </>
                  )}
                </EventRow>
              );
            })
          ))}
      </div>

      <Modal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Убрать запись из списка?"
        description={removing ? `«${removing.event.title}» пропадёт из «Моих активностей». Отменить это нельзя.` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRemoving(null)}>
              Отмена
            </Button>
            <Button
              loading={hide.isPending}
              onClick={() => removing && hide.mutate(removing.id, { onSuccess: () => setRemoving(null) })}
            >
              Убрать
            </Button>
          </>
        }
      >
        <p className="text-muted">Организатор ничего не потеряет: запись скрывается только у вас.</p>
      </Modal>
    </div>
  );
}

interface EventRowProps {
  event: SportEvent;
  children: ReactNode;
  /** Кнопка справа (над ссылкой-оверлеем карточки) */
  action?: ReactNode;
}

function EventRow({ event, children, action }: EventRowProps) {
  // Удалённое мероприятие открыть нельзя, поэтому строка без ссылки
  const linkable = event.status !== "deleted";
  const palette = eventPalette(event, useColorSafe());
  return (
    <Card className={linkable ? "lift relative flex gap-4 p-4" : "relative flex gap-4 p-4"}>
      <div className="grid size-16 shrink-0 place-items-center rounded-2xl sm:size-20" style={{ backgroundColor: palette.background }}>
        <SportIllustration sport={event.sport} tint={palette.tint} className="text-[38px] sm:text-[46px]" />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold leading-snug">
          {linkable ? (
            <Link to={`/events/${event.id}`} className="after:absolute after:inset-0 after:content-['']">
              {event.title}
            </Link>
          ) : (
            event.title
          )}
        </h2>
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[15px] text-muted">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4" aria-hidden />
            {formatEventDate(event.starts_at)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4" aria-hidden />
            {event.address.split(",")[0]}
          </span>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">{children}</div>
        {action && <div className="relative z-10 -mb-1 -ml-3 mt-1">{action}</div>}
      </div>
    </Card>
  );
}
