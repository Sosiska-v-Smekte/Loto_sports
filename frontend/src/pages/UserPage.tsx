import {
  Building2,
  CalendarPlus,
  MapPin,
  Pencil,
  Plus,
  UserX,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { errorMessage } from "@/api/client";
import { meApi } from "@/api/endpoints";
import type { User, UserPublic, UserSport, UserStats } from "@/api/types";
import { BackLink } from "@/components/BackLink";
import { CityCombobox } from "@/components/CityCombobox";
import { Engraving } from "@/components/Engraving";
import { EventGrid } from "@/components/EventGrid";
import { ProfileEditModal } from "@/components/ProfileEditModal";
import { SportIllustration } from "@/components/SportIllustration";
import { SportsModal } from "@/components/SportsModal";
import { Avatar } from "@/components/ui/Avatar";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Field";
import { LoadingBlock } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";
import { Switch } from "@/components/ui/Switch";
import { Tag } from "@/components/ui/Tag";
import { useColorSafe } from "@/features/accessibility";
import { useAction } from "@/features/action";
import { useAuth } from "@/features/auth";
import { useMyOrganization } from "@/features/me";
import { useUserPage } from "@/features/organizations";
import { mutedColor, safeCardColor } from "@/lib/color";
import { SPORT_LEVEL_LABEL } from "@/lib/status";

export function UserPage() {
  const id = Number(useParams().id);
  const page = useUserPage(id);
  const { user: viewer } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editingSports, setEditingSports] = useState(false);

  if (page.isPending) return <LoadingBlock className="page-container mt-8" />;
  if (page.isError) {
    return (
      <div className="page-container mt-8">
        <EmptyState
          icon={UserX}
          title="Пользователь не найден"
          action={<ButtonLink to="/">На главную</ButtonLink>}
        />
      </div>
    );
  }
  const { user, events, sports, stats } = page.data;
  const isOwn = viewer?.id === user.id;

  return (
    <div className="page-container max-w-6xl pt-4 lg:pt-6">
      {isOwn ? (
        <>
          <h1 className="text-[30px] font-bold leading-tight sm:text-[40px]">
            Профиль
          </h1>
          <p className="mt-1 text-lg text-muted">
            Настройки аккаунта и ваши спортивные интересы
          </p>
        </>
      ) : (
        <BackLink />
      )}

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-8">
          <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-7">
            <Avatar
              name={user.name}
              id={user.id}
              src={user.avatar_url}
              size="xl"
            />
            <div className="min-w-0 flex-1">
              {isOwn ? (
                <h2 className="text-[28px] font-bold leading-tight sm:text-[32px]">
                  {user.name}
                </h2>
              ) : (
                <h1 className="text-[28px] font-bold leading-tight sm:text-[36px]">
                  {user.name}
                </h1>
              )}
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
              <Button
                icon={<Pencil className="size-4" aria-hidden />}
                onClick={() => setEditing(true)}
                className="self-start sm:self-center"
              >
                Редактировать профиль
              </Button>
            )}
          </Card>

          <section aria-labelledby="sports-title">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionTitle id="sports-title">
                {isOwn
                  ? "Мои спортивные направления"
                  : "Спортивные направления"}
              </SectionTitle>
              {isOwn && sports.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Pencil className="size-4" aria-hidden />}
                  onClick={() => setEditingSports(true)}
                >
                  Изменить
                </Button>
              )}
            </div>
            {sports.length > 0 ? (
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {sports.map((item) => (
                  <li key={item.sport.id}>
                    <SportCard item={item} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                className="mt-4"
                icon={Plus}
                title={
                  isOwn
                    ? "Добавьте, чем вы занимаетесь"
                    : "Направления не указаны"
                }
                text={
                  isOwn
                    ? "Выберите направления и свой уровень: так вас легче найти для общих встреч."
                    : undefined
                }
                action={
                  isOwn && (
                    <Button
                      icon={<Plus className="size-5" aria-hidden />}
                      onClick={() => setEditingSports(true)}
                    >
                      Выбрать направления
                    </Button>
                  )
                }
              />
            )}
          </section>

          {isOwn && viewer && <PersonalData viewer={viewer} />}
        </div>

        <aside className="flex flex-col gap-5" aria-label="Сводка">
          <ActivityCard stats={stats} sports={sports} />
          {isOwn && <OrganizerCard profile={user} />}
        </aside>
      </div>

      <section aria-labelledby="upcoming-title" className="mt-8">
        <SectionTitle id="upcoming-title">Ближайшие активности</SectionTitle>
        <EventGrid
          events={events}
          isPending={false}
          error={null}
          onRetry={() => page.refetch()}
          className="mt-4"
          empty={
            <EmptyState icon={CalendarPlus} title="Ближайших активностей нет" />
          }
        />
      </section>

      {editing && (
        <ProfileEditModal
          open
          onClose={() => setEditing(false)}
          profile={user}
        />
      )}
      {editingSports && (
        <SportsModal
          open
          onClose={() => setEditingSports(false)}
          current={sports}
        />
      )}
    </div>
  );
}

function SportCard({ item }: { item: UserSport }) {
  const colorSafe = useColorSafe();
  const background = colorSafe
    ? safeCardColor(item.sport.color)
    : item.sport.color;
  return (
    <article
      className="tinted-3d relative isolate flex h-36 flex-col justify-between overflow-hidden rounded-card p-4"
      style={{ backgroundColor: background }}
    >
      <Engraving pattern={null} />
      <h3 className="max-w-[60%] text-[22px] font-semibold leading-tight">
        {item.sport.name}
      </h3>
      <Tag tone="level" className="self-start bg-white/70">
        {SPORT_LEVEL_LABEL[item.level]}
      </Tag>
      <SportIllustration
        sport={item.sport}
        className="absolute bottom-1 right-2 text-[92px]"
      />
    </article>
  );
}

function ActivityCard({
  stats,
  sports,
}: {
  stats: UserStats;
  sports: UserSport[];
}) {
  const rows: [number, string][] = [
    [stats.attended, "посещено активностей"],
    [stats.organized, "организовано"],
    [stats.clubs, stats.clubs === 1 ? "клуб" : "клуба"],
  ];
  return (
    <Card className="relative overflow-hidden p-5">
      <h2 className="text-xl font-semibold">Активность</h2>
      <dl className="mt-3 flex flex-col gap-3">
        {rows.map(([value, label]) => (
          <div key={label}>
            <dd className="text-[34px] font-bold leading-none tabular-nums">
              {value}
            </dd>
            <dt className="mt-0.5 text-muted">{label}</dt>
          </div>
        ))}
      </dl>
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-3 right-3 flex -space-x-3"
      >
        {sports.slice(0, 2).map((s) => (
          <SportIllustration
            key={s.sport.id}
            sport={s.sport}
            className="text-[56px]"
          />
        ))}
      </span>
    </Card>
  );
}

/** Розовая карточка «Статус организатора»: ведёт к управлению клубом или к заявке на организацию. */
function OrganizerCard({ profile }: { profile: UserPublic }) {
  const organization = useMyOrganization();
  const colorSafe = useColorSafe();
  const status = organization.data?.status;
  const background = colorSafe
    ? safeCardColor("#F2A9C8")
    : mutedColor("#F2A9C8");
  return (
    <section
      aria-labelledby="org-status"
      className="tinted-3d rounded-card p-5"
      style={{ backgroundColor: background }}
    >
      <h2 id="org-status" className="text-xl font-semibold leading-tight">
        Статус организатора
      </h2>
      {status === "approved" ? (
        <>
          <p className="mt-2">
            Управляйте событиями и составом клуба «{organization.data?.name}».
          </p>
          <ButtonLink to="/communities" className="mt-4 w-full">
            Управлять клубом
          </ButtonLink>
        </>
      ) : status === "pending" ? (
        <>
          <p className="mt-2">
            Заявка организации «{organization.data?.name}» на рассмотрении у
            администратора.
          </p>
          <ButtonLink
            to="/communities"
            variant="secondary"
            className="mt-4 w-full"
          >
            Посмотреть заявку
          </ButtonLink>
        </>
      ) : (
        <>
          <p className="mt-2">
            {status === "rejected"
              ? "Заявку отклонили: исправьте данные и отправьте снова."
              : `${profile.name.split(" ")[0]}, создайте страницу организации и соберите участников.`}
          </p>
          <ButtonLink to="/communities?apply=1" className="mt-4 w-full">
            {status === "rejected" ? "Исправить заявку" : "Создать организацию"}
          </ButtonLink>
        </>
      )}
    </section>
  );
}

/** «Личные данные и уведомления»: данные сохраняются кнопкой, переключатели действуют сразу. */
function PersonalData({ viewer }: { viewer: User }) {
  const [form, setForm] = useState({
    name: viewer.name,
    city: viewer.city ?? "Москва",
    about: viewer.about ?? "",
  });
  const [touched, setTouched] = useState(false);
  const save = useAction(meApi.updateProfile, "Сохранено");
  const base = {
    name: viewer.name,
    city: viewer.city ?? "Москва",
    about: viewer.about ?? "",
  };

  const nameError =
    form.name.trim().length < 2 ? "Имя — минимум 2 символа" : undefined;
  const dirty =
    form.name !== base.name ||
    form.city !== base.city ||
    form.about !== base.about;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!nameError)
      save.mutate({
        ...form,
        name: form.name.trim(),
        about: form.about.trim(),
      });
  };

  return (
    <section aria-labelledby="personal-title">
      <SectionTitle id="personal-title">
        Личные данные и уведомления
      </SectionTitle>
      <Card className="mt-4 grid gap-6 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Имя и фамилия"
              required
              maxLength={120}
              value={form.name}
              error={touched ? nameError : undefined}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <CityCombobox
              label="Город"
              required
              value={form.city}
              onChange={(city) => setForm((f) => ({ ...f, city }))}
            />
          </div>
          <Textarea
            label="О себе"
            rows={3}
            maxLength={500}
            value={form.about}
            onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))}
          />
          {save.isError && (
            <p
              role="alert"
              className="rounded-2xl bg-danger px-4 py-3 font-medium text-danger-ink"
            >
              {errorMessage(save.error)}
            </p>
          )}
          <Button
            type="submit"
            loading={save.isPending}
            disabled={!dirty}
            className="self-start"
          >
            Сохранить
          </Button>
        </form>
        <div className="flex flex-col gap-5 md:border-l md:border-line md:pl-6">
          <Switch
            label="Уведомления о новых тренировках"
            hint="Приглашения, когда появляется встреча по вашим отметкам «Я бы пошёл»"
            checked={viewer.notify_new}
            disabled={save.isPending}
            onChange={(value) => save.mutate({ ...base, notify_new: value })}
          />
          <div className="border-t border-line" />
          <Switch
            label="Напоминания о скором старте"
            hint="За сутки до начала мероприятий, на которые вы записаны или которые организуете"
            checked={viewer.notify_remind}
            disabled={save.isPending}
            onChange={(value) => save.mutate({ ...base, notify_remind: value })}
          />
        </div>
      </Card>
    </section>
  );
}
