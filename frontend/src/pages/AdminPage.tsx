import { Check, EyeOff, Inbox, MessageSquare, Search, Trash2, X } from "lucide-react";
import { useState, type ReactNode } from "react";
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
  const [orgFilter, setOrgFilter] = useState<AdminOrganization | null>(null);

  return (
    <div className="page-container pt-6 lg:pt-10">
      <h1 className="text-[30px] font-bold leading-tight sm:text-[40px]">Админка</h1>
      <p className="mt-2 text-muted">Проверка организаций и модерация мероприятий. Все решения требуют причины, кроме одобрения.</p>
      <Tabs
        className="mt-5"
        label="Разделы админки"
        value={tab}
        onChange={(value) => {
          setTab(value);
          setOrgFilter(null);
        }}
        items={[
          { value: "requests", label: "Заявки организаций" },
          { value: "organizations", label: "Организации" },
          { value: "events", label: "Мероприятия" },
        ]}
      />
      <div className="mt-5">
        {tab === "requests" && <OrganizationsTab key="requests" defaultStatus="pending" />}
        {tab === "organizations" && (
          <OrganizationsTab
            key="organizations"
            onShowEvents={(org) => {
              setTab("events");
              setOrgFilter(org);
            }}
          />
        )}
        {tab === "events" && <EventsTab organization={orgFilter} onClearOrganization={() => setOrgFilter(null)} />}
      </div>
    </div>
  );
}

/* ---------- Общие элементы ---------- */

function Toolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3 sm:flex-row">{children}</div>;
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

function StatusSelect<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T | "";
  onChange: (v: T | "") => void;
  options: Record<T, string>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T | "")}
      aria-label="Фильтр по статусу"
      className="h-12 rounded-full border border-line bg-white/80 px-4 focus:border-primary focus:outline-none sm:w-56"
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

function ListState({ isPending, error, onRetry, empty }: { isPending: boolean; error: unknown; onRetry: () => void; empty: boolean }) {
  if (isPending) {
    return (
      <div className="flex flex-col gap-3" aria-hidden>
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-card" />
        ))}
      </div>
    );
  }
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (empty) return <EmptyState icon={Inbox} title="Ничего не найдено" text="Попробуйте изменить поиск или фильтр." />;
  return null;
}

const TH = "px-4 py-3 text-left text-sm font-medium uppercase tracking-wide text-muted";
const TD = "px-4 py-4 align-top";

/* ---------- Организации ---------- */

const ORG_STATUS_LABELS: Record<OrganizationStatus, string> = {
  pending: "На рассмотрении",
  approved: "Одобрены",
  rejected: "Отклонены",
};

function OrganizationsTab({
  defaultStatus,
  onShowEvents,
}: {
  defaultStatus?: OrganizationStatus;
  onShowEvents?: (org: AdminOrganization) => void;
}) {
  const [status, setStatus] = useState<OrganizationStatus | "">(defaultStatus ?? "");
  const [q, setQ] = useState("");
  const [rejecting, setRejecting] = useState<AdminOrganization | null>(null);
  const list = useAdminOrganizations(status || undefined, q.trim());
  const approve = useAction(
    (id: number) => adminApi.approveOrganization(id),
    "Организация одобрена — теперь она может публиковать мероприятия",
  );
  const reject = useAction(
    ({ id, reason }: { id: number; reason: string }) => adminApi.rejectOrganization(id, reason),
    "Заявка отклонена. Владелец увидит причину в профиле",
  );

  const actions = (org: AdminOrganization) => (
    <div className="flex flex-wrap gap-2">
      {org.status === "pending" && (
        <>
          <Button
            size="sm"
            variant="success"
            icon={<Check className="size-4" aria-hidden />}
            loading={approve.isPending && approve.variables === org.id}
            onClick={() => approve.mutate(org.id)}
          >
            Одобрить
          </Button>
          <Button size="sm" variant="secondary" icon={<X className="size-4" aria-hidden />} onClick={() => setRejecting(org)}>
            Отклонить
          </Button>
        </>
      )}
      {onShowEvents && (
        <Button size="sm" variant="secondary" onClick={() => onShowEvents(org)}>
          Мероприятия ({org.events_count})
        </Button>
      )}
    </div>
  );

  const statusTag = (org: AdminOrganization) => {
    const view = ORGANIZATION_STATUS[org.status];
    return (
      <Tag tone={view.tone} icon={view.icon}>
        {view.label}
      </Tag>
    );
  };

  const data = list.data ?? [];

  return (
    <>
      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Название, владелец, email или город" />
        <StatusSelect value={status} onChange={setStatus} options={ORG_STATUS_LABELS} />
      </Toolbar>

      <div className="mt-4">
        <ListState isPending={list.isPending} error={list.error} onRetry={() => list.refetch()} empty={data.length === 0} />

        {data.length > 0 && (
          <>
            <Card className="hidden overflow-hidden lg:block">
              <table className="w-full">
                <thead className="border-b border-line bg-surface-muted">
                  <tr>
                    <th className={TH}>Организация</th>
                    <th className={TH}>Владелец</th>
                    <th className={TH}>Статус</th>
                    <th className={TH}>Подана</th>
                    <th className={TH}>
                      <span className="sr-only">Действия</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.map((org) => (
                    <tr key={org.id}>
                      <td className={`${TD} max-w-md`}>
                        <p className="font-semibold">{org.name}</p>
                        <p className="text-sm text-muted">
                          {org.city} · {org.sports}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[15px]">{org.description}</p>
                        <p className="mt-1 text-sm text-muted">Контакты: {org.contacts || "не указаны"}</p>
                        {org.rejection_reason && (
                          <p className="mt-1 text-sm font-medium text-danger-ink">Причина отказа: {org.rejection_reason}</p>
                        )}
                      </td>
                      <td className={TD}>
                        <p className="font-medium">{org.owner.name}</p>
                        <p className="text-sm text-muted">{org.owner_email}</p>
                      </td>
                      <td className={TD}>{statusTag(org)}</td>
                      <td className={`${TD} whitespace-nowrap text-[15px] text-muted`}>{formatShortDate(org.created_at)}</td>
                      <td className={`${TD} text-right`}>{actions(org)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <div className="flex flex-col gap-3 lg:hidden">
              {data.map((org) => (
                <Card key={org.id} className="flex flex-col gap-3 p-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{org.name}</h2>
                      {statusTag(org)}
                    </div>
                    <p className="mt-1 text-[15px] text-muted">
                      {org.owner.name} ({org.owner_email}) · {org.city} · {org.sports}
                    </p>
                    <p className="mt-2 line-clamp-3">{org.description}</p>
                    <p className="mt-1 text-[15px] text-muted">Контакты: {org.contacts || "не указаны"}</p>
                    {org.rejection_reason && (
                      <p className="mt-1 text-[15px] font-medium text-danger-ink">Причина отказа: {org.rejection_reason}</p>
                    )}
                  </div>
                  {actions(org)}
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      <ReasonModal
        open={rejecting !== null}
        onClose={() => setRejecting(null)}
        title="Отклонить заявку?"
        description={rejecting ? `«${rejecting.name}» увидит причину в своём профиле и сможет отправить заявку снова.` : ""}
        confirmLabel="Отклонить"
        danger
        loading={reject.isPending}
        onConfirm={(reason) =>
          rejecting && reject.mutate({ id: rejecting.id, reason }, { onSuccess: () => setRejecting(null) })
        }
      />
    </>
  );
}

/* ---------- Мероприятия ---------- */

const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  published: "Опубликованы",
  unpublished: "Сняты с публикации",
  deleted: "Удалены",
};

type Moderation = { event: SportEvent; mode: "unpublish" | "delete" } | null;

function EventsTab({ organization, onClearOrganization }: { organization: AdminOrganization | null; onClearOrganization: () => void }) {
  const [status, setStatus] = useState<EventStatus | "">("");
  const [q, setQ] = useState("");
  const [target, setTarget] = useState<Moderation>(null);
  const list = useAdminEvents({ status: status || undefined, q: q.trim() || undefined, organization_id: organization?.id });
  const moderate = useAction(
    ({ id, mode, reason }: { id: number; mode: "unpublish" | "delete"; reason: string }) =>
      mode === "delete" ? adminApi.deleteEvent(id, reason) : adminApi.unpublishEvent(id, reason),
    (event) => (event.status === "deleted" ? "Мероприятие удалено" : "Мероприятие снято с публикации. Организатор увидит причину"),
  );

  const organizerLink = (event: SportEvent) => (
    <Link
      to={event.organization ? `/communities/${event.organization.id}` : `/users/${event.organizer.id}`}
      className="underline underline-offset-2 hover:text-primary"
    >
      {event.organization?.name ?? event.organizer.name}
    </Link>
  );

  const actions = (event: SportEvent) =>
    event.status === "deleted" ? null : (
      <div className="flex flex-wrap gap-2 lg:justify-end">
        {event.status === "published" && (
          <Button
            size="sm"
            variant="secondary"
            icon={<EyeOff className="size-4" aria-hidden />}
            onClick={() => setTarget({ event, mode: "unpublish" })}
          >
            Снять
          </Button>
        )}
        <Button
          size="sm"
          variant="danger"
          icon={<Trash2 className="size-4" aria-hidden />}
          onClick={() => setTarget({ event, mode: "delete" })}
        >
          Удалить
        </Button>
      </div>
    );

  const statusTag = (event: SportEvent) => {
    const view = EVENT_STATUS[event.status];
    return (
      <Tag tone={view.tone} icon={view.icon}>
        {view.label}
      </Tag>
    );
  };

  const discussionLink = (event: SportEvent) => (
    <Link to={`/events/${event.id}#discussion`} className="inline-flex items-center gap-1 text-sm underline underline-offset-2">
      <MessageSquare className="size-4" aria-hidden />
      Обсуждение
    </Link>
  );

  const data = list.data ?? [];

  return (
    <>
      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Название, адрес, город или организатор" />
        <StatusSelect value={status} onChange={setStatus} options={EVENT_STATUS_LABELS} />
      </Toolbar>
      {organization && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-info px-4 py-2 text-info-ink">
          Мероприятия организации «{organization.name}»
          <Button size="sm" variant="ghost" className="!min-h-9 underline" onClick={onClearOrganization}>
            Показать все
          </Button>
        </div>
      )}

      <div className="mt-4">
        <ListState isPending={list.isPending} error={list.error} onRetry={() => list.refetch()} empty={data.length === 0} />

        {data.length > 0 && (
          <>
            <Card className="hidden overflow-hidden lg:block">
              <table className="w-full">
                <thead className="border-b border-line bg-surface-muted">
                  <tr>
                    <th className={TH}>Мероприятие</th>
                    <th className={TH}>Организатор</th>
                    <th className={TH}>Когда</th>
                    <th className={TH}>Статус</th>
                    <th className={TH}>
                      <span className="sr-only">Действия</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.map((event) => (
                    <tr key={event.id}>
                      <td className={`${TD} max-w-sm`}>
                        <Link to={`/events/${event.id}`} className="font-semibold hover:underline">
                          {event.sport.icon} {event.title}
                        </Link>
                        <p className="text-sm text-muted">
                          {event.city} · {event.address.split(",")[0]}
                        </p>
                        <div className="mt-1">{discussionLink(event)}</div>
                      </td>
                      <td className={`${TD} text-[15px]`}>{organizerLink(event)}</td>
                      <td className={`${TD} whitespace-nowrap text-[15px]`}>{formatEventDate(event.starts_at)}</td>
                      <td className={TD}>
                        {statusTag(event)}
                        {event.moderation_reason && (
                          <p className="mt-1 max-w-[16rem] text-sm text-danger-ink">{event.moderation_reason}</p>
                        )}
                      </td>
                      <td className={TD}>{actions(event)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <div className="flex flex-col gap-3 lg:hidden">
              {data.map((event) => (
                <Card key={event.id} className="flex flex-col gap-3 p-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/events/${event.id}`} className="text-lg font-semibold hover:underline">
                        {event.sport.icon} {event.title}
                      </Link>
                      {statusTag(event)}
                    </div>
                    <p className="mt-1 text-[15px] text-muted">
                      {formatEventDate(event.starts_at)} · {event.city} · {organizerLink(event)}
                    </p>
                    <div className="mt-1">{discussionLink(event)}</div>
                    {event.moderation_reason && (
                      <p className="mt-1 text-[15px] font-medium text-danger-ink">Причина: {event.moderation_reason}</p>
                    )}
                  </div>
                  {actions(event)}
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      <ReasonModal
        open={target !== null}
        onClose={() => setTarget(null)}
        title={target?.mode === "delete" ? "Удалить мероприятие?" : "Снять с публикации?"}
        description={
          target
            ? `«${target.event.title}». ${
                target.mode === "delete"
                  ? "Оно пропадёт из всех списков."
                  : "Оно исчезнет из ленты, записавшиеся увидят статус «Мероприятие снято»."
              } Организатор увидит причину.`
            : ""
        }
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
