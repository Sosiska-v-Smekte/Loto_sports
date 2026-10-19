import { useState, type FormEvent } from "react";
import { errorMessage } from "@/api/client";
import { meApi } from "@/api/endpoints";
import type { Organization, OrganizationInput } from "@/api/types";
import { useAction } from "@/features/action";
import { CityCombobox } from "../CityCombobox";
import { Button } from "../ui/Button";
import { Input, Textarea } from "../ui/Field";

interface OrganizationFormProps {
  /** Отклонённая заявка: форма заполнена прежними данными для повторной отправки */
  initial: Organization | null;
  onCancel?: () => void;
}

/** Заявка на допуск организации. Отправляется администратору, до одобрения публиковать от её имени нельзя. */
export function OrganizationForm({ initial, onCancel }: OrganizationFormProps) {
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
    city: form.city ? undefined : "Выберите город из списка",
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
        <CityCombobox
          label="Город"
          required
          value={form.city}
          error={touched ? errors.city : undefined}
          onChange={(city) => setForm((f) => ({ ...f, city }))}
        />
      </div>
      <Input label="Контакты" placeholder="+7 900 000-00-00, club@mail.ru" required {...bind("contacts")} />
      {submit.isError && (
        <p role="alert" className="rounded-2xl bg-danger px-4 py-3 font-medium text-danger-ink">
          {errorMessage(submit.error)}
        </p>
      )}
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        {onCancel && (
          <Button variant="secondary" size="lg" onClick={onCancel}>
            Отмена
          </Button>
        )}
        <Button type="submit" size="lg" loading={submit.isPending}>
          {initial ? "Отправить заявку снова" : "Отправить заявку"}
        </Button>
      </div>
    </form>
  );
}
