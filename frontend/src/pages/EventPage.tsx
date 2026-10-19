import { Ban, Backpack, CalendarDays, Gauge, MapPin, Trash2, UsersRound, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "@/api/client";
import type { SportEvent } from "@/api/types";
import { BackLink } from "@/components/BackLink";
import { CommentThread } from "@/components/CommentThread";
import { AdminModeration } from "@/components/event/AdminModeration";
import { JoinPanel } from "@/components/event/JoinPanel";
import { ManagePanel } from "@/components/event/ManagePanel";
import { SportIllustration } from "@/components/SportIllustration";
import { JOIN_MODE_ICON } from "@/components/StatusBadge";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { LoadingBlock } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Tag } from "@/components/ui/Tag";
import { useAuth } from "@/features/auth";
import { useEvent, useParticipants } from "@/features/events";
import { formatEventDateLong } from "@/lib/dates";
import { pluralize } from "@/lib/names";
import { JOIN_MODE_HINT, JOIN_MODE_LABEL, LEVEL_HINT, LEVEL_LABEL, organizerKind } from "@/lib/status";

export function EventPage() {
  const id = Number(useParams().id);
  const event = useEvent(id);

  if (event.isPending) return <LoadingBlock className="page-container mt-8" />;
  if (event.isError) {
    if (event.error instanceof ApiError && event.error.status === 404) {
      return (
        <div className="page-container mt-8">
          <EmptyState
            icon={Ban}
            title={event.error.message}
            text="Возможно, его сняли с публикации или удалили. Посмотрите другие активности."
            action={<ButtonLink to="/">К поиску активностей</ButtonLink>}
          />
        </div>
      );
    }
    return <ErrorState error={event.error} onRetry={() => event.refetch()} className="page-container mt-8" />;
  }
  return <EventView event={event.data} />;
}

function EventView({ event }: { event: SportEvent }) {
  const { user } = useAuth();
  const participants = useParticipants(event.id);
  const ModeIcon = JOIN_MODE_ICON[event.join_mode];

  return (
    <div className="page-container pt-4 lg:pt-6">
      <BackLink />

      {event.status === "unpublished" && (
        <Notice tone="danger" icon={Ban} title={`Мероприятие снято с публикации: ${event.moderation_reason ?? "без причины"}`} className="mt-3">
          Его не видно в ленте и поиске, записаться нельзя. Уже сделанные записи сохранены.
        </Notice>
      )}
      {event.status === "deleted" && (
        <Notice tone="danger" icon={Trash2} title={`Мероприятие удалено: ${event.moderation_reason ?? "без причины"}`} className="mt-3">
          Его видит только администратор.
        </Notice>
      )}

      <header
        className="relative mt-3 overflow-hidden rounded-card px-5 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-7"
        style={{ backgroundColor: event.sport.color }}
      >
        <div className="relative z-[1] max-w-[calc(100%-6rem)] sm:max-w-[70%]">
          <Tag tone="level" className="bg-white/55">
            {event.sport.name}
          </Tag>
          <h1 className="mt-3 text-[30px] font-bold leading-[1.08] tracking-[-0.02em] sm:text-[44px]">{event.title}</h1>
          <p className="mt-3 flex items-center gap-2 text-lg">
            <CalendarDays className="size-5 shrink-0" aria-hidden />
            {formatEventDateLong(event.starts_at, event.ends_at)}
          </p>
        </div>
        <SportIllustration
          sport={event.sport}
          className="absolute -bottom-3 right-4 text-[88px] sm:bottom-auto sm:right-10 sm:top-1/2 sm:-translate-y-1/2 sm:text-[150px]"
        />
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="flex flex-col gap-6">
          <Card className="p-5 sm:p-6">
            <dl className="grid gap-5 sm:grid-cols-2">
              <Fact icon={MapPin} label="Где">
                <span className="font-medium">{event.address}</span>
                <span className="block text-muted">{event.city}</span>
                {event.place_details && <span className="mt-1 block">{event.place_details}</span>}
              </Fact>
              <Fact icon={Gauge} label="Уровень">
                <span className="font-medium">{LEVEL_LABEL[event.level]}</span>
                <span className="block text-muted">{LEVEL_HINT[event.level]}</span>
              </Fact>
              <Fact icon={Backpack} label="Подготовка и инвентарь" wide>
                {event.requirements || <span className="text-muted">Ничего особенного не нужно</span>}
              </Fact>
            </dl>
            {event.description && (
              <div className="mt-6 border-t border-line pt-5">
                <h2 className="text-lg font-semibold">Описание</h2>
                <p className="mt-2 whitespace-pre-line text-[17px] leading-relaxed">{event.description}</p>
              </div>
            )}
          </Card>

          {event.can_manage && participants.data && <ManagePanel participants={participants.data} />}
          {user?.is_admin && <AdminModeration event={event} />}
          <CommentThread event={event} />
        </div>

        {/* На телефоне запись — главное действие, поэтому колонка идёт сразу под шапкой */}
        <aside className="order-first flex flex-col gap-6 lg:order-none lg:sticky lg:top-[108px]">
          <Card className="p-5 sm:p-6">
            <p className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted">
              <ModeIcon className="size-4" aria-hidden />
              Как записаться
            </p>
            <p className="mt-1 text-2xl font-semibold">{JOIN_MODE_LABEL[event.join_mode]}</p>
            <p className="mt-2 text-muted">{JOIN_MODE_HINT[event.join_mode]}</p>
            <div className="mt-5">
              <JoinPanel event={event} />
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <p className="text-sm font-medium uppercase tracking-wide text-muted">Организатор</p>
            <Link
              to={event.organization ? `/communities/${event.organization.id}` : `/users/${event.organizer.id}`}
              className="mt-3 flex items-center gap-3 rounded-2xl hover:underline"
            >
              <Avatar name={event.organizer.name} id={event.organizer.id} src={event.organizer.avatar_url} size="md" />
              <span>
                <span className="block font-semibold">{event.organization?.name ?? event.organizer.name}</span>
                <span className="block text-sm text-muted">
                  {organizerKind(event)}
                  {event.organization && ` · ведёт ${event.organizer.name}`}
                </span>
              </span>
            </Link>
          </Card>

          <Card className="p-5 sm:p-6">
            <p className="flex items-center gap-2 font-semibold">
              <UsersRound className="size-5" aria-hidden />
              {event.participants_count} {pluralize(event.participants_count, "участник", "участника", "участников")}
            </p>
            {participants.data && participants.data.confirmed.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {participants.data.confirmed.map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/users/${p.user.id}`}
                      className="flex min-h-11 items-center gap-2 rounded-full bg-surface-muted py-1 pl-1 pr-3 text-[15px] hover:bg-white"
                    >
                      <Avatar name={p.user.name} id={p.user.id} src={p.user.avatar_url} />
                      {p.user.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-muted">
                {event.can_manage ? "Пока участников нет." : "Пока никто не записался — станьте первым!"}
              </p>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Fact({ icon: Icon, label, children, wide }: { icon: LucideIcon; label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted">
        <Icon className="size-4" aria-hidden />
        {label}
      </dt>
      <dd className="mt-1.5 text-[17px]">{children}</dd>
    </div>
  );
}
