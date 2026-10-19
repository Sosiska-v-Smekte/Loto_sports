import { Check, EyeOff, Inbox, Search, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "@/api/endpoints";
import type { AdminOrganization, EventStatus, OrganizationStatus, SportEvent } from "@/api/types";
import { ReasonModal } from "@/components/ReasonModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Tabs } from "@/components/ui/Tabs";
import { Tag } from "@/components/ui/Tag";
import { useAction } from "@/features/action";
import { useAdminEvents, useAdminOrganizations } from "@/features/admin";
import { formatEventDate, formatShortDate } from "@/lib/dates";
import { EVENT_STATUS, ORGANIZATION_STATUS } from "@/lib/status";

type Tab = "requests" | "organizations" | "events";

export function AdminPage() {
  const [tab, setTab] = useState<Tab>("requests");
  const [orgFilter, setOrgFilter] = useState<number | undefined>();

  return (
    <div className="page-container pt-6 lg:pt-10">
      <h1 className="text-[30px] font-bold sm:text-[40px]">Админка</h1>
      <Tabs
        className="mt-5"
        label="Разделы админки"
        value={tab}
        onChange={(value) => {
          setTab(value);
          if (value !== "events") setOrgFilter(undefined);
        }}
        items={[
          { value: "requests", label: "Заявки организаций" },
          { value: "organizations", label: "Организации" },
          { value: "events", label: "Мероприятия" },
        ]}
      />
      <div className="mt-5">
        {tab === "requests" && <OrganizationsTab defaultStatus="pending" />}
        {tab === "organizations" && (
          <OrganizationsTab
            onShowEvents={(id) => {
              setOrgFilter(id);
              setTab("events");
            }}
          />
        )}
        {tab === "events" && <EventsTab organizationId={orgFilter} onClearOrganization={() => setOrgFilter(undefined)} />}
      </div>
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-12 w-full rounded-full border border-line bg-white/80 pl-11 pr-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
      />
    </div>
  );
}

function StatusSelect<T extends string>({ value, onChange, options }: { value: T | ""; onChange: (v: T | "") => void; options: Record<T, string> }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T | "")}
      aria-label="Фильтр по статусу"
      className="h-12 rounded-full border border-line bg-white/80 px-4 focus:border-primary focus:outline-none"
    >
      <option value="">Все статусы</option>
      {(Object.keys(options) as T[]).map((key) => (
        <option key={key} value={key}>
          {options[key]}
        </option>
      ))}
    </select>
  );
}

const ORG_STATUS_LABELS: Record<OrganizationStatus, string> = { pending: "На рассмотрении", approved: "Одобрены", rejected: "Отклонены" };
const EVENT_STATUS_LABELS: Record<EventStatus, string> = { published: "Опубликованы", unpublished: "Сняты", deleted: "Удалены" };

function OrganizationsTab({ defaultStatus, onShowEvents }: { defaultStatus?: OrganizationStatus; onShowEvents?: (id: number) => void }) {
  const [status, setStatus] = useState<OrganizationStatus | "">(defaultStatus ?? "");
  const [q, setQ] = useState("");
  const [rejecting, setRejecting] = useState<AdminOrganization | null>(null);
  const list = useAdminOrganizations(status || undefined, q.trim());
  const approve = useAction((id: number) => adminApi.approveOrganization(id), "Организация одобрена — теперь она может публиковать мероприятия");
  const reject = useAction(
    ({ id, reason }: { id: number; reason: string }) => adminApi.rejectOrganization(id, reason),
    "Заявка отклонена. Владелец увидит причину",
  );

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput value={q} onChange={setQ} placeholder="Название, владелец, город" />
        <StatusSelect value={status} onChange={setStatus} options={ORG_STATUS_LABELS} />
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {list.isPending && Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-28 rounded-card" />)}
        {list.isError && <ErrorState error={list.error} onRetry={() => list.refetch()} />}
        {list.data?.length === 0 && <EmptyState icon={Inbox} title="Ничего не найдено" text="Заявок с таким статусом нет." />}
        {list.data?.map((org) => {
          const view = ORGANIZATION_STATUS[org.status];
          return (
            <Card key={org.id} className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-start">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{org.name}</h2>
                  <Tag tone={view.tone} icon={view.icon}>
                    {view.label}
                  </Tag>
                </div>
                <p className="mt-1 text-[15px] text-muted">
                  {org.owner.name} ({org.owner_email}) · {org.city} · {org.sports} · подана {formatShortDate(org.created_at)}
                </p>
                <p className="mt-2 line-clamp-2">{org.description}</p>
                <p className="mt-1 text-[15px] text-muted">Контакты: {org.contacts || "не указаны"}</p>
                {org.rejection_reason && <p className="mt-1 text-[15px] font-medium text-danger-ink">Причина отказа: {org.rejection_reason}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                {org.status === "pending" && (
                  <>
                    <Button size="sm" variant="success" icon={<Check className="size-4" aria-hidden />} loading={approve.isPending && approve.variables === org.id} onClick={() => approve.mutate(org.id)}>
                      Одобрить
                    </Button>
                    <Button size="sm" variant="secondary" icon={<X className="size-4" aria-hidden />} onClick={() => setRejecting(org)}>
                      Отклонить
                    </Button>
                  </>
                )}
                {onShowEvents && (
                  <Button size="sm" variant="secondary" onClick={() => onShowEvents(org.id)}>
                    Мероприятия ({org.events_count})
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      <ReasonModal
        open={rejecting !== null}
        onClose={() => setRejecting(null)}
        title="Отклонить заявку?"
        description={rejecting ? `«${rejecting.name}» увидит причину в своём профиле.` : ""}
        confirmLabel="Отклонить"
        danger
        loading={reject.isPending}
        onConfirm={(reason) => rejecting && reject.mutate({ id: rejecting.id, reason }, { onSuccess: () => setRejecting(null) })}
      />
    </>
  );
}

type Moderation = { event: SportEvent; mode: "unpublish" | "delete" } | null;

function EventsTab({ organizationId, onClearOrganization }: { organizationId?: number; onClearOrganization: () => void }) {
  const [status, setStatus] = useState<EventStatus | "">("");
  const [q, setQ] = useState("");
  const [target, setTarget] = useState<Moderation>(null);
  const list = useAdminEvents({ status: status || undefined, q: q.trim() || undefined, organization_id: organizationId });
  const moderate = useAction(
    ({ id, mode, reason }: { id: number; mode: "unpublish" | "delete"; reason: string }) =>
      mode === "delete" ? adminApi.deleteEvent(id, reason) : adminApi.unpublishEvent(id, reason),
    (event) => (event.status === "deleted" ? "Мероприятие удалено" : "Мероприятие снято с публикации"),
  );

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput value={q} onChange={setQ} placeholder="Название, адрес, организатор" />
        <StatusSelect value={status} onChange={setStatus} options={EVENT_STATUS_LABELS} />
      </div>
      {organizationId && (
        <Button size="sm" variant="ghost" className="mt-2 underline" onClick={onClearOrganization}>
          Показаны мероприятия одной организации — показать все
        </Button>
      )}
      <div className="mt-4 flex flex-col gap-3">
        {list.isPending && Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24 rounded-card" />)}
        {list.isError && <ErrorState error={list.error} onRetry={() => list.refetch()} />}
        {list.data?.length === 0 && <EmptyState icon={Inbox} title="Мероприятий не найдено" />}
        {list.data?.map((event) => {
          const view = EVENT_STATUS[event.status];
          return (
            <Card key={event.id} className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/events/${event.id}`} className="text-lg font-semibold hover:underline">
                    {event.sport.icon} {event.title}
                  </Link>
                  <Tag tone={view.tone} icon={view.icon}>
                    {view.label}
                  </Tag>
                </div>
                <p className="mt-1 text-[15px] text-muted">
                  {formatEventDate(event.starts_at)} · {event.city} ·{" "}
                  <Link to={`/users/${event.organizer.id}`} className="underline underline-offset-2">
                    {event.organization?.name ?? event.organizer.name}
                  </Link>{" "}
                  · <Link to={`/events/${event.id}#discussion`} className="underline underline-offset-2">обсуждение</Link>
                </p>
                {event.moderation_reason && <p className="mt-1 text-[15px] font-medium text-danger-ink">Причина: {event.moderation_reason}</p>}
              </div>
              {event.status !== "deleted" && (
                <div className="flex flex-wrap gap-2">
                  {event.status === "published" && (
                    <Button size="sm" variant="secondary" icon={<EyeOff className="size-4" aria-hidden />} onClick={() => setTarget({ event, mode: "unpublish" })}>
                      Снять
                    </Button>
                  )}
                  <Button size="sm" variant="danger" icon={<Trash2 className="size-4" aria-hidden />} onClick={() => setTarget({ event, mode: "delete" })}>
                    Удалить
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      <ReasonModal
        open={target !== null}
        onClose={() => setTarget(null)}
        title={target?.mode === "delete" ? "Удалить мероприятие?" : "Снять с публикации?"}
        description={target ? `«${target.event.title}». Организатор увидит причину.` : ""}
        confirmLabel={target?.mode === "delete" ? "Удалить" : "Снять с публикации"}
        danger={target?.mode === "delete"}
        loading={moderate.isPending}
        onConfirm={(reason) =>
          target && moderate.mutate({ id: target.event.id, mode: target.mode, reason }, { onSuccess: () => setTarget(null) })
        }
      />
    </>
  );
}
