import { CalendarDays, CalendarPlus, Clock, MapPin, Search, UsersRound } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { SportEvent } from "@/api/types";
import { SportIllustration } from "@/components/SportIllustration";
import { StatusBadge } from "@/components/StatusBadge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Tabs } from "@/components/ui/Tabs";
import { Tag } from "@/components/ui/Tag";
import { useMyEvents, useMyParticipations } from "@/features/me";
import { formatEventDate } from "@/lib/dates";
import { EVENT_STATUS } from "@/lib/status";
import type { ReactNode } from "react";

type Tab = "joined" | "organized";

export function MyPage() {
  const [tab, setTab] = useState<Tab>("joined");
  const joined = useMyParticipations();
  const organized = useMyEvents();
  const active = tab === "joined" ? joined : organized;

  return (
    <div className="page-container max-w-4xl pt-6 lg:pt-10">
      <h1 className="text-[30px] font-bold sm:text-[40px]">Мои активности</h1>
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
              <EventRow key={p.id} event={p.event}>
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
    </div>
  );
}

function EventRow({ event, children }: { event: SportEvent; children: ReactNode }) {
  return (
    <Card className="lift relative flex gap-4 p-4">
      <div className="grid size-16 shrink-0 place-items-center rounded-2xl sm:size-20" style={{ backgroundColor: event.sport.color }}>
        <SportIllustration sport={event.sport} className="text-[38px] sm:text-[46px]" />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold leading-snug">
          <Link to={`/events/${event.id}`} className="after:absolute after:inset-0 after:content-['']">
            {event.title}
          </Link>
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
      </div>
    </Card>
  );
}
