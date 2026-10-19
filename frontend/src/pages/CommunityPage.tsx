import { Building2, CalendarPlus, MapPin, Phone } from "lucide-react";
import { useParams } from "react-router-dom";
import { BackLink } from "@/components/BackLink";
import { EventGrid } from "@/components/EventGrid";
import { ButtonLink } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { LoadingBlock } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";
import { Tag } from "@/components/ui/Tag";
import { useOrganization } from "@/features/organizations";

export function CommunityPage() {
  const id = Number(useParams().id);
  const page = useOrganization(id);

  if (page.isPending) return <LoadingBlock className="page-container mt-8" />;
  if (page.isError) {
    return (
      <div className="page-container mt-8">
        <EmptyState
          icon={Building2}
          title="Организация не найдена"
          text="Возможно, она ещё не прошла проверку."
          action={<ButtonLink to="/communities">Все сообщества</ButtonLink>}
        />
      </div>
    );
  }
  const { organization, events } = page.data;

  return (
    <div className="page-container pt-4 lg:pt-6">
      <BackLink to="/communities" label="Все сообщества" />
      <Card className="mt-3 p-5 sm:p-8">
        <h1 className="text-[30px] font-bold leading-tight sm:text-[40px]">{organization.name}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {organization.sports.split(",").map((s) => (
            <Tag key={s} tone="level">
              {s.trim()}
            </Tag>
          ))}
        </div>
        <p className="mt-4 max-w-3xl whitespace-pre-line text-[17px] leading-relaxed">{organization.description}</p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-muted">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4" aria-hidden />
            {organization.city}
          </span>
          {organization.contacts && (
            <span className="flex items-center gap-1.5">
              <Phone className="size-4" aria-hidden />
              {organization.contacts}
            </span>
          )}
        </div>
      </Card>
      <SectionTitle className="mt-8">Мероприятия</SectionTitle>
      <EventGrid
        events={events}
        isPending={false}
        error={null}
        onRetry={() => page.refetch()}
        className="mt-4"
        empty={<EmptyState icon={CalendarPlus} title="Ближайших мероприятий нет" text="Загляните позже." />}
      />
    </div>
  );
}
