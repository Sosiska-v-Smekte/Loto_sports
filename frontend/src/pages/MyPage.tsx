import { CalendarDays, CalendarPlus, Check, Clock, MapPin, MessageCircle, Search, Settings2, UsersRound, X } from "lucide-react";
import { SimpleHint } from "@/components/SimpleHint";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { meApi } from "@/api/endpoints";
import type { MyParticipation, SportEvent } from "@/api/types";
import { Engraving } from "@/components/Engraving";
import { MyCalendar } from "@/components/MyCalendar";
import { SportIllustration } from "@/components/SportIllustration";
import { StatusBadge } from "@/components/StatusBadge";
import { Avatar } from "@/components/ui/Avatar";
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
import { dayjs, formatEventDate, formatShortWhen } from "@/lib/dates";
import { EVENT_STATUS, isOutdatedParticipation } from "@/lib/status";

type Tab = "upcoming" | "requests" | "organized" | "past";

/** Событие в расписании: либо я записан/подал заявку, либо я его организую. */
interface Entry {
  key: string;
  event: SportEvent;
  participation?: MyParticipation;
}

const byStart = (a: Entry, b: Entry) => a.event.starts_at.localeCompare(b.event.starts_at);
const dayOf = (iso: string) => dayjs(iso).format("YYYY-MM-DD");

export function MyPage() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [day, setDay] = useState<string | null>(null);
  const joined = useMyParticipations();
  const organized = useMyEvents();
  const [removing, setRemoving] = useState<MyParticipation | null>(null);
  const [cancelling, setCancelling] = useState<MyParticipation | null>(null);
  const hide = useAction((id: number) => meApi.hideParticipation(id), "Запись убрана из списка");
  const cancel = useAction((id: number) => meApi.cancelParticipation(id), "Запись отменена");

  const lists = useMemo(() => {
    const mine = (joined.data ?? []).map<Entry>((p) => ({ key: `p${p.id}`, event: p.event, participation: p }));
    const own = (organized.data ?? []).map<Entry>((event) => ({ key: `e${event.id}`, event }));
    const live = (e: Entry) => e.event.status === "published";
    const going = (e: Entry) => !e.participation || ["confirmed", "pending"].includes(e.participation.status);
    return {
      upcoming: [...mine, ...own].filter((e) => live(e) && going(e) && !e.event.is_past).sort(byStart),
      past: [...mine, ...own]
        .filter((e) => live(e) && e.event.is_past && (!e.participation || e.participation.status === "confirmed"))
        .sort((a, b) => byStart(b, a)),
      requests: mine.filter((e) => e.participation!.status !== "confirmed" || e.event.status !== "published"),
      organized: own,
    };
  }, [joined.data, organized.data]);

  // Дни с активностями для календаря: и будущие, и прошедшие
  const busyDays = useMemo(
    () => new Set([...lists.upcoming, ...lists.past].map((e) => dayOf(e.event.starts_at))),
    [lists.upcoming, lists.past],
  );

  const loading = joined.isPending || organized.isPending;
  const error = joined.error ?? organized.error;
  const shown = lists[tab].filter((e) => !day || dayOf(e.event.starts_at) === day);
  const next = lists.upcoming[0];

  return (
    <div className="page-container max-w-6xl pt-6 lg:pt-10">
      <h1 className="text-[30px] font-bold leading-tight sm:text-[40px]">Мои активности</h1>
      <p className="mt-1 text-lg text-muted">Ваше расписание тренировок и событий</p>
      <SimpleHint className="mt-4" title="Что здесь">
        Все занятия, на которые вы записались. «Предстоящие» — что ещё впереди, «Мои заявки» — что ждёт ответа организатора. Нажмите на занятие, чтобы открыть его.
      </SimpleHint>

      <div data-simple-single className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          <Tabs
            label="Мои активности"
            value={tab}
            onChange={setTab}
            items={[
              { value: "upcoming", label: "Предстоящие", count: joined.data && organized.data ? lists.upcoming.length : undefined },
              { value: "requests", label: "Мои заявки", count: joined.data ? lists.requests.length : undefined },
              { value: "organized", label: "Организую", count: organized.data?.length },
              { value: "past", label: "Прошедшие", count: joined.data && organized.data ? lists.past.length : undefined },
            ]}
          />

          {tab === "upcoming" && next && !day && <NextUp entry={next} />}

          {day && (
            <p className="flex flex-wrap items-center gap-2 text-[15px]">
              <span>Показаны активности на {dayjs(day).format("D MMMM")}.</span>
              <Button size="sm" variant="ghost" className="underline underline-offset-4" onClick={() => setDay(null)}>
                Показать все
              </Button>
            </p>
          )}

          <section aria-label={tab === "upcoming" ? "Ближайшие активности" : "Список"} className="flex flex-col gap-3">
            {tab === "upcoming" && !day && next && <h2 className="text-xl font-semibold">Ближайшие активности</h2>}
            {loading && Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-24 rounded-card" />)}
            {error && <ErrorState error={error} onRetry={() => (joined.isError ? joined : organized).refetch()} />}

            {!loading && !error && shown.length === 0 && <Empty tab={tab} day={day} />}

            {!loading &&
              !error &&
              shown.map((entry) => (
                <Row
                  key={entry.key}
                  entry={entry}
                  tab={tab}
                  onCancel={setCancelling}
                  onRemove={setRemoving}
                />
              ))}
          </section>
        </div>

        <aside data-simple-hide className="flex flex-col gap-5 lg:sticky lg:top-24" aria-label="Расписание">
          <MyCalendar busyDays={busyDays} selected={day} onSelect={setDay} />
          <Timeline entries={lists.upcoming.slice(0, 3)} />
        </aside>
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

      <Modal
        open={cancelling !== null}
        onClose={() => setCancelling(null)}
        title={cancelling?.status === "pending" ? "Отменить заявку?" : "Отменить запись?"}
        description={cancelling ? `«${cancelling.event.title}», ${formatEventDate(cancelling.event.starts_at)}` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelling(null)}>
              Оставить
            </Button>
            <Button
              loading={cancel.isPending}
              onClick={() => cancelling && cancel.mutate(cancelling.id, { onSuccess: () => setCancelling(null) })}
            >
              Отменить
            </Button>
          </>
        }
      >
        <p className="text-muted">Место освободится. Записаться заново можно, пока мероприятие не началось.</p>
      </Modal>
    </div>
  );
}

function Empty({ tab, day }: { tab: Tab; day: string | null }) {
  if (day) return <EmptyState icon={CalendarDays} title="В этот день ничего нет" text="Выберите другой день в календаре." />;
  if (tab === "organized") {
    return (
      <EmptyState
        icon={CalendarPlus}
        title="Вы ещё ничего не организовали"
        text="Создайте активность — это займёт пару минут."
        action={<ButtonLink to="/events/new">Создать активность</ButtonLink>}
      />
    );
  }
  if (tab === "requests") {
    return <EmptyState icon={Clock} title="Заявок нет" text="Здесь будут заявки на мероприятия «по заявке» и записи, которые отменили." />;
  }
  if (tab === "past") {
    return <EmptyState icon={CalendarDays} title="Прошедших активностей пока нет" text="Когда вы сходите на мероприятие, оно появится здесь." />;
  }
  return (
    <EmptyState
      icon={Search}
      title="Предстоящих активностей нет"
      text="Найдите активность по душе и присоединяйтесь."
      action={<ButtonLink to="/">Найти активность</ButtonLink>}
    />
  );
}

/** Крупная карточка ближайшего события: цвет и иллюстрация направления, как на карточках ленты. */
function NextUp({ entry }: { entry: Entry }) {
  const { event, participation } = entry;
  const colorSafe = useColorSafe();
  const palette = eventPalette(event, colorSafe);
  return (
    <article
      className="tinted-3d relative isolate overflow-hidden rounded-card px-5 py-5 sm:px-7 sm:py-6"
      style={{ backgroundColor: palette.background }}
    >
      <Engraving pattern={event.card_pattern} />
      <h2 className="max-w-[calc(100%-6rem)] text-[22px] font-semibold leading-tight sm:max-w-[calc(100%-11rem)] sm:text-[26px]">
        {formatEventDate(event.starts_at)} — {event.title}
      </h2>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {participation ? (
          <StatusBadge status={participation.status} eventStatus={event.status} className="bg-white/70" />
        ) : (
          <Tag tone="level" icon={Check} className="bg-white/70">
            Вы организатор
          </Tag>
        )}
        {colorSafe && <Tag tone="level" className="bg-white/70">{event.sport.name}</Tag>}
      </div>
      <p className="mt-3 text-[15px]">Организатор: {event.organizer.name}</p>
      <ButtonLink to={`/events/${event.id}#discussion`} className="mt-4" icon={<MessageCircle className="size-5" aria-hidden />}>
        Перейти к обсуждению
      </ButtonLink>
      <SportIllustration sport={event.sport} className="absolute right-3 top-3 text-[80px] sm:right-6 sm:top-1/2 sm:-translate-y-1/2 sm:text-[140px]" />
    </article>
  );
}

interface RowProps {
  entry: Entry;
  tab: Tab;
  onCancel: (p: MyParticipation) => void;
  onRemove: (p: MyParticipation) => void;
}

/** Строка расписания: дата и название, статус и главное действие. */
function Row({ entry, tab, onCancel, onRemove }: RowProps) {
  const { event, participation } = entry;
  // Удалённое мероприятие открыть нельзя, поэтому строка без ссылки
  const linkable = event.status !== "deleted";
  const isPast = event.is_past;
  const palette = eventPalette(event, useColorSafe());
  const status = EVENT_STATUS[event.status];

  let badge: ReactNode;
  let actions: ReactNode = null;
  if (participation) {
    badge = <StatusBadge status={participation.status} eventStatus={event.status} />;
    const live = event.status === "published" && !isPast;
    if (live && participation.status === "confirmed") {
      actions = (
        <>
          <ButtonLink to={`/events/${event.id}#discussion`} size="sm" className="relative z-10">
            Чат
          </ButtonLink>
          <Button size="sm" variant="ghost" className="relative z-10 text-muted" onClick={() => onCancel(participation)}>
            Отменить
          </Button>
        </>
      );
    } else if (live && participation.status === "pending") {
      actions = (
        <Button size="sm" variant="secondary" className="relative z-10" onClick={() => onCancel(participation)}>
          Отменить
        </Button>
      );
    } else if (isOutdatedParticipation(participation.status, event.status)) {
      actions = (
        <Button
          size="sm"
          variant="ghost"
          className="relative z-10 text-muted"
          icon={<X className="size-4" aria-hidden />}
          onClick={() => onRemove(participation)}
        >
          Убрать из списка
        </Button>
      );
    }
  } else {
    const pending = event.pending_count ?? 0;
    badge = (
      <>
        {pending > 0 ? (
          <Tag tone="warning" icon={Clock}>
            Организатор — {pending} {pending === 1 ? "новая заявка" : pending < 5 ? "новые заявки" : "новых заявок"}
          </Tag>
        ) : (
          <Tag tone="level" icon={UsersRound}>
            {isPast ? "Вы организовали" : "Вы организатор"}
            {tab === "organized" ? ` · участников: ${event.participants_count}` : ""}
          </Tag>
        )}
        {event.status !== "published" && (
          <Tag tone={status.tone} icon={status.icon}>
            {status.label}
          </Tag>
        )}
      </>
    );
    if (event.status === "published" && !isPast) {
      actions = (
        <ButtonLink to={`/events/${event.id}`} size="sm" className="relative z-10" icon={<Settings2 className="size-4" aria-hidden />}>
          Управлять
        </ButtonLink>
      );
    }
  }
  const reason = event.status !== "published" ? event.moderation_reason : null;

  return (
    <Card className={linkable ? "lift relative flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4" : "relative flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4"}>
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <div
          className="grid size-14 shrink-0 place-items-center rounded-2xl sm:size-16"
          style={{ backgroundColor: palette.background }}
        >
          <SportIllustration sport={event.sport} className="text-[34px] sm:text-[40px]" />
        </div>
        <div className="min-w-0">
          <h2 className="text-[17px] font-semibold leading-snug">
            <span className="text-muted">{formatShortWhen(event.starts_at)} — </span>
            {linkable ? (
              <Link to={`/events/${event.id}`} className="after:absolute after:inset-0 after:content-['']">
                {event.title}
              </Link>
            ) : (
              event.title
            )}
          </h2>
          <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[15px] text-muted">
            <span>{participation ? `Организатор: ${event.organizer.name}` : "Вы организатор"}</span>
            <span className="flex items-center gap-1">
              <MapPin className="size-4" aria-hidden />
              {event.address.split(",")[0]}
            </span>
          </p>
          {reason && <p className="mt-1 text-sm font-medium text-danger-ink">Причина: {reason}</p>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">{badge}</div>
      {actions && <div className="flex shrink-0 items-center gap-1 sm:ml-1">{actions}</div>}
    </Card>
  );
}

/** «Ближайшая по расписанию»: короткая лента из трёх событий. */
function Timeline({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) return null;
  return (
    <Card className="p-5">
      <h2 className="text-xl font-semibold leading-tight">Ближайшая по расписанию</h2>
      <ol className="relative mt-4 flex flex-col gap-5">
        <span aria-hidden className="absolute bottom-3 left-[19px] top-3 w-px bg-line" />
        {entries.map(({ event }) => (
          <li key={event.id} className="relative flex gap-3">
            <span
              className="relative z-10 grid size-10 shrink-0 place-items-center rounded-xl"
              style={{ backgroundColor: event.sport.color }}
            >
              <SportIllustration sport={event.sport} compact className="text-[26px]" />
            </span>
            <div className="min-w-0">
              <Link to={`/events/${event.id}`} className="font-medium leading-snug hover:underline">
                {event.title}
              </Link>
              <p className="text-sm text-muted">{formatEventDate(event.starts_at)}</p>
              <p className="flex items-center gap-1 text-sm text-muted">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{event.address.split(",")[0]}</span>
              </p>
              <p className="mt-1.5 flex items-center gap-2 text-sm">
                <Avatar name={event.organizer.name} id={event.organizer.id} src={event.organizer.avatar_url} />
                <span className="text-muted">Участников: {event.participants_count}</span>
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
