import { Building2, CheckCircle2, Clock, ExternalLink, Plus, XCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { errorMessage } from "@/api/client";
import { meApi } from "@/api/endpoints";
import type { Organization, OrganizationInput } from "@/api/types";
import { Avatar } from "@/components/ui/Avatar";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { LoadingBlock } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { useAction } from "@/features/action";
import { useAuth } from "@/features/auth";
import { useMyOrganization } from "@/features/me";

export function ProfilePage() {
  const { user } = useAuth();
  const organization = useMyOrganization();
  if (!user) return null;

  return (
    <div className="page-container max-w-3xl pt-6 lg:pt-10">
      <h1 className="text-[30px] font-bold sm:text-[40px]">Профиль</h1>
      <Card className="mt-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        <Avatar name={user.name} id={user.id} src={user.avatar_url} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-xl font-semibold">{user.name}</p>
          <p className="text-muted">
            {user.email}
            {user.city && ` · ${user.city}`}
          </p>
          {user.about && <p className="mt-2">{user.about}</p>}
        </div>
        <ButtonLink to={`/users/${user.id}`} variant="secondary" size="sm" icon={<ExternalLink className="size-4" aria-hidden />}>
          Публичный профиль
        </ButtonLink>
      </Card>

      <section className="mt-8" aria-labelledby="org-title">
        <h2 id="org-title" className="flex items-center gap-2 text-2xl font-semibold">
          <Building2 className="size-6" aria-hidden />
          Моя организация
        </h2>
        <div className="mt-4">
          {organization.isPending && <LoadingBlock />}
          {organization.isError && <ErrorState error={organization.error} onRetry={() => organization.refetch()} />}
          {organization.isSuccess && <OrganizationBlock organization={organization.data} />}
        </div>
      </section>
    </div>
  );
}

function OrganizationBlock({ organization }: { organization: Organization | null }) {
  if (organization?.status === "approved") {
    return (
      <Card className="flex flex-col gap-4 p-5 sm:p-6">
        <Notice tone="success" icon={CheckCircle2} title={`«${organization.name}» одобрена`}>
          Вы можете публиковать мероприятия от имени организации — без повторной проверки.
        </Notice>
        <div className="flex flex-wrap gap-3">
          <ButtonLink to="/events/new?as=org" icon={<Plus className="size-5" aria-hidden />}>
            Создать мероприятие от организации
          </ButtonLink>
          <ButtonLink to={`/communities/${organization.id}`} variant="secondary">
            Публичная страница
          </ButtonLink>
        </div>
      </Card>
    );
  }
  if (organization?.status === "pending") {
    return (
      <Card className="flex flex-col gap-4 p-5 sm:p-6">
        <Notice tone="warning" icon={Clock} title="Заявка на рассмотрении">
          Администратор проверит «{organization.name}». До одобрения публиковать мероприятия от имени организации нельзя, и
          публичной страницы пока нет. От своего имени создавать активности можно.
        </Notice>
        <OrganizationSummary organization={organization} />
      </Card>
    );
  }
  return (
    <Card className="flex flex-col gap-5 p-5 sm:p-6">
      {organization?.status === "rejected" ? (
        <Notice tone="danger" icon={XCircle} title="Заявка отклонена">
          Причина: {organization.rejection_reason}. Исправьте данные и отправьте заявку снова.
        </Notice>
      ) : (
        <p className="text-muted">
          Клуб, секция или сообщество? Отправьте заявку — после одобрения администратором вы сможете публиковать мероприятия
          от имени организации, и у неё появится публичная страница.
        </p>
      )}
      <OrganizationForm initial={organization} />
    </Card>
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

function OrganizationForm({ initial }: { initial: Organization | null }) {
  const [form, setForm] = useState<OrganizationInput>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    sports: initial?.sports ?? "",
    city: initial?.city ?? "Москва",
    contacts: initial?.contacts ?? "",
  });
  const [touched, setTouched] = useState(false);
  const submit = useAction(meApi.submitOrganization, "Заявка отправлена администратору");

  const errors: Partial<Record<keyof OrganizationInput, string>> = {
    name: form.name.trim().length < 3 ? "Название — минимум 3 символа" : undefined,
    description: form.description.trim().length < 10 ? "Опишите организацию хотя бы в одном предложении" : undefined,
    sports: form.sports.trim().length < 2 ? "Укажите хотя бы одно направление" : undefined,
    city: form.city.trim().length < 2 ? "Укажите город" : undefined,
    contacts: form.contacts.trim().length < 3 ? "Телефон, почта или ссылка для связи" : undefined,
  };
  const valid = !Object.values(errors).some(Boolean);
  const bind = (key: keyof OrganizationInput) => ({
    value: form[key],
    error: touched ? errors[key] : undefined,
    onChange: (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (valid) submit.mutate(form);
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Input label="Название организации" required {...bind("name")} />
      <Textarea label="Описание" required rows={3} {...bind("description")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Направления" placeholder="Шахматы, бег" required {...bind("sports")} />
        <Input label="Город" required {...bind("city")} />
      </div>
      <Input label="Контакты" placeholder="+7 900 000-00-00, club@mail.ru" required {...bind("contacts")} />
      {submit.isError && (
        <p role="alert" className="rounded-2xl bg-danger px-4 py-3 font-medium text-danger-ink">
          {errorMessage(submit.error)}
        </p>
      )}
      <Button type="submit" size="lg" loading={submit.isPending} className="self-start">
        {initial ? "Отправить заявку снова" : "Отправить заявку"}
      </Button>
    </form>
  );
}
