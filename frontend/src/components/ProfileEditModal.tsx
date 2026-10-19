import { useState } from "react";
import { errorMessage } from "@/api/client";
import { meApi } from "@/api/endpoints";
import type { UserPublic } from "@/api/types";
import { useAction } from "@/features/action";
import { Button } from "./ui/Button";
import { Input, Textarea } from "./ui/Field";
import { Modal } from "./ui/Modal";

interface ProfileEditModalProps {
  open: boolean;
  onClose: () => void;
  profile: UserPublic;
}

export function ProfileEditModal({ open, onClose, profile }: ProfileEditModalProps) {
  const [form, setForm] = useState({ name: profile.name, city: profile.city ?? "Москва", about: profile.about ?? "" });
  const [touched, setTouched] = useState(false);
  const save = useAction(meApi.updateProfile, "Профиль сохранён");

  const errors = {
    name: form.name.trim().length < 2 ? "Имя — минимум 2 символа" : undefined,
    city: form.city.trim().length < 2 ? "Укажите город" : undefined,
  };
  const valid = !errors.name && !errors.city;

  const submit = () => {
    setTouched(true);
    if (valid) save.mutate({ ...form, name: form.name.trim(), about: form.about.trim() }, { onSuccess: onClose });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Редактировать профиль"
      description="Эти данные видят другие участники."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button loading={save.isPending} onClick={submit}>
            Сохранить
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Input
          label="Имя"
          required
          value={form.name}
          maxLength={120}
          error={touched ? errors.name : undefined}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <Input
          label="Город"
          required
          value={form.city}
          error={touched ? errors.city : undefined}
          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
        />
        <Textarea
          label="О себе"
          rows={3}
          maxLength={500}
          value={form.about}
          hint="Чем занимаетесь, что ищете — необязательно"
          onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))}
        />
        {save.isError && (
          <p role="alert" className="rounded-2xl bg-danger px-4 py-3 font-medium text-danger-ink">
            {errorMessage(save.error)}
          </p>
        )}
      </form>
    </Modal>
  );
}
