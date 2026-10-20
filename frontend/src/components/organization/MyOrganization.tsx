import { Building2, CheckCircle2, Clock, LogIn, Plus, XCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { meApi } from "@/api/endpoints";
import type { Organization } from "@/api/types";
import { useAuth } from "@/features/auth";
import { useMyOrganization } from "@/features/me";
import { AvatarUploader } from "../AvatarUploader";
import { Button, ButtonLink } from "../ui/Button";
import { Card } from "../ui/Card";
import { Notice } from "../ui/Notice";
import { Skeleton } from "../ui/Skeleton";
import { ErrorState } from "../ui/States";
import { DemandList } from "../DemandList";
import { useDemand } from "@/features/planning";
import { OrganizationForm } from "./OrganizationForm";
import { VenuesManager } from "./VenuesManager";

export function MyOrganization({
  applying,
  onApplyingChange,
}: {
  applying?: boolean;
  onApplyingChange?: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const organization = useMyOrganization(Boolean(user));
  const [ownFormOpen, setOwnFormOpen] = useState(false);
  const formOpen = applying ?? ownFormOpen;
  const setFormOpen = (open: boolean) => (onApplyingChange ? onApplyingChange(open) : setOwnFormOpen(open));

  if (!user) {
    return (
      <Intro
        action={
          <ButtonLink to="/login?next=%2Fcommunities" icon={<LogIn className="size-5" aria-hidden />}>
            Войти, чтобы создать организацию
          </ButtonLink>
        }
      />
    );
  }
  if (organization.isPending) return <Skeleton className="h-28 rounded-card" />;
  if (organization.isError) return <ErrorState error={organization.error} onRetry={() => organization.refetch()} />;

  const org = organization.data;
  if (!org) {
    if (!formOpen) {
      return (
        <Intro
          action={
            <Button icon={<Plus className="size-5" aria-hidden />} onClick={() => setFormOpen(true)}>
              Создать организацию
            </Button>
          }
        />
      );
    }
    return (
      <Card className="flex flex-col gap-5 p-5 sm:p-6">
        <div>
          <h2 className="text-xl font-semibold">Новая организация</h2>
          <p className="mt-1 text-muted">
            Администратор проверит заявку. После одобрения вы сможете публиковать мероприятия от имени организации, и у
            неё появится публичная страница.
          </p>
        </div>
        <OrganizationForm initial={null} onCancel={() => setFormOpen(false)} />
      </Card>
    );
  }
  return <OrganizationStatusCard organization={org} />;
}

function Intro({ action }: { action: ReactNode }) {
  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-level">
        <Building2 className="size-6" aria-hidden />
      </span>
      <div className="flex-1">
        <p className="font-semibold">Ведёте клуб, секцию или сообщество?</p>
        <p className="text-muted">Создайте организацию — её мероприятия будут собраны на отдельной странице.</p>
      </div>
      {action}
    </Card>
  );
}

function OrganizationStatusCard({ organization }: { organization: Organization }) {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries();
  return (
    <Card className="flex flex-col gap-4 p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <Building2 className="size-6" aria-hidden />
        Моя организация
      </h2>
      {organization.status === "approved" && (
        <>
          <Notice tone="success" icon={CheckCircle2} title={`«${organization.name}» одобрена`}>
            Вы можете публиковать мероприятия от имени организации — без повторной проверки.
          </Notice>
          <AvatarUploader
            name={organization.name}
            id={organization.id}
            src={organization.avatar_url}
            onUpload={(image) => meApi.setOrganizationAvatar(image).then(refresh)}
            onRemove={() => meApi.removeOrganizationAvatar().then(refresh)}
          />
          <VenuesManager city={organization.city} />
          <OrganizationDemand city={organization.city} />
          <div className="flex flex-wrap gap-3">
            <ButtonLink to="/events/new?as=org" icon={<Plus className="size-5" aria-hidden />}>
              Создать мероприятие от организации
            </ButtonLink>
            <ButtonLink to={`/communities/${organization.id}`} variant="secondary">
              Публичная страница
            </ButtonLink>
          </div>
        </>
      )}
      {organization.status === "pending" && (
        <>
          <Notice tone="warning" icon={Clock} title="Заявка на рассмотрении">
            Администратор проверит «{organization.name}». До одобрения публиковать мероприятия от имени организации нельзя,
            и публичной страницы пока нет. От своего имени создавать активности можно.
          </Notice>
          <OrganizationSummary organization={organization} />
        </>
      )}
      {organization.status === "rejected" && (
        <>
          <Notice tone="danger" icon={XCircle} title="Заявка отклонена">
            Причина: {organization.rejection_reason}. Исправьте данные и отправьте заявку снова.
          </Notice>
          <OrganizationForm initial={organization} />
        </>
      )}
    </Card>
  );
}

function OrganizationDemand({ city }: { city: string }) {
  const demand = useDemand(city);
  if (!demand.data?.length) return null;
  return (
    <section aria-labelledby="demand-title" className="flex flex-col gap-3 border-t border-line pt-4">
      <div>
        <h3 id="demand-title" className="text-lg font-semibold">
          Спрос в городе {city}
        </h3>
        <p className="text-muted">Эти люди хотят заниматься, но подходящей встречи пока нет. Создайте открытую встречу, и они получат приглашение.</p>
      </div>
      <DemandList groups={demand.data} limit={4} />
    </section>
  );
}

function OrganizationSummary({ organization }: { organization: Organization }) {
  return (
    <dl className="grid gap-3 text-[15px] sm:grid-cols-2">
      {(
        [
          ["Название", organization.name],
          ["Город", organization.city],
          ["Направления", organization.sports],
          ["Контакты", organization.contacts],
        ] as const
      ).map(([label, value]) => (
        <div key={label}>
          <dt className="text-muted">{label}</dt>
          <dd className="font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
