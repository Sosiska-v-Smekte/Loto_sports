import { Building2, CalendarPlus, MapPin, Pencil, UserX } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BackLink } from "@/components/BackLink";
import { EventGrid } from "@/components/EventGrid";
import { ProfileEditModal } from "@/components/ProfileEditModal";
import { Avatar } from "@/components/ui/Avatar";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { LoadingBlock } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";
import { useAuth } from "@/features/auth";
import { useUserPage } from "@/features/organizations";

export function UserPage() {
  const id = Number(useParams().id);
  const page = useUserPage(id);
  const { user: viewer } = useAuth();
  const [editing, setEditing] = useState(false);

  if (page.isPending) return <LoadingBlock className="page-container mt-8" />;
  if (page.isError) {
    return (
      <div className="page-container mt-8">
        <EmptyState icon={UserX} title="Пользователь не найден" action={<ButtonLink to="/">На главную</ButtonLink>} />
      </div>
    );
  }
  const { user, events } = page.data;
  const isOwn = viewer?.id === user.id;

  return (
    <div className="page-container pt-4 lg:pt-6">
      <BackLink />
      <Card className="mt-3 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-8">
        <Avatar name={user.name} id={user.id} src={user.avatar_url} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-[28px] font-bold leading-tight sm:text-[36px]">{user.name}</h1>
          {user.city && (
            <p className="mt-1 flex items-center gap-1.5 text-muted">
              <MapPin className="size-4" aria-hidden />
              {user.city}
            </p>
          )}
          {user.about && <p className="mt-2 text-[17px]">{user.about}</p>}
          {user.organization && (
            <Link
              to={`/communities/${user.organization.id}`}
              className="mt-2 inline-flex items-center gap-1.5 font-medium text-primary underline underline-offset-4"
            >
              <Building2 className="size-4" aria-hidden />
              {user.organization.name}
            </Link>
          )}
        </div>
        {isOwn && (
          <Button variant="secondary" size="sm" icon={<Pencil className="size-4" aria-hidden />} onClick={() => setEditing(true)} className="self-start sm:self-center">
            Редактировать
          </Button>
        )}
      </Card>
      {editing && <ProfileEditModal open onClose={() => setEditing(false)} profile={user} />}
      <SectionTitle className="mt-8">Ближайшие активности</SectionTitle>
      <EventGrid
        events={events}
        isPending={false}
        error={null}
        onRetry={() => page.refetch()}
        className="mt-4"
        empty={<EmptyState icon={CalendarPlus} title="Ближайших активностей нет" />}
      />
    </div>
  );
}
