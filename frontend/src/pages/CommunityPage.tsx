import { useQueryClient } from "@tanstack/react-query";
import { Building2, CalendarPlus, Camera, MapPin, Phone, UsersRound } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { meApi } from "@/api/endpoints";
import { AvatarModal } from "@/components/AvatarModal";
import { BackLink } from "@/components/BackLink";
import { EventGrid } from "@/components/EventGrid";
import { JoinCommunityButton } from "@/components/JoinCommunityButton";
import { Avatar } from "@/components/ui/Avatar";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { LoadingBlock } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";
import { Tag } from "@/components/ui/Tag";
import { useAuth } from "@/features/auth";
import { useOrganization } from "@/features/organizations";
import { membersLabel } from "@/lib/interests";

export function CommunityPage() {
  const id = Number(useParams().id);
  const page = useOrganization(id);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [changingPhoto, setChangingPhoto] = useState(false);

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
  const isOwner = user?.id === organization.owner.id;
  const refresh = () => queryClient.invalidateQueries();

  return (
    <div className="page-container pt-4 lg:pt-6">
      <BackLink to="/communities" label="Все сообщества" />
      <Card className="mt-3 p-5 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar name={organization.name} id={organization.id} src={organization.avatar_url} size="xl" />
          <h1 className="min-w-0 flex-1 text-[30px] font-bold leading-tight [overflow-wrap:anywhere] sm:text-[40px]">{organization.name}</h1>
          {!isOwner && <JoinCommunityButton organization={organization} className="self-start sm:self-center" />}
          {isOwner && (
            <Button variant="secondary" size="sm" icon={<Camera className="size-4" aria-hidden />} onClick={() => setChangingPhoto(true)} className="self-start sm:self-center">
              Сменить фото
            </Button>
          )}
        </div>
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
          <span className="flex items-center gap-1.5">
            <UsersRound className="size-4" aria-hidden />
            {membersLabel(organization.members_count)}
          </span>
          {organization.contacts && (
            <span className="flex items-center gap-1.5">
              <Phone className="size-4" aria-hidden />
              {organization.contacts}
            </span>
          )}
        </div>
      </Card>
      {isOwner && (
        <AvatarModal
          open={changingPhoto}
          onClose={() => setChangingPhoto(false)}
          title="Фото сообщества"
          name={organization.name}
          id={organization.id}
          src={organization.avatar_url}
          onUpload={(image) => meApi.setOrganizationAvatar(image).then(refresh)}
          onRemove={() => meApi.removeOrganizationAvatar().then(refresh)}
        />
      )}
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
