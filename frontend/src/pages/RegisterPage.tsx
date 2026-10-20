import { useMutation } from "@tanstack/react-query";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { errorMessage } from "@/api/client";
import { authApi } from "@/api/endpoints";
import { A11yChoice } from "@/components/A11yChoice";
import { AgreementModal, type AgreementKind } from "@/components/AgreementModal";
import { CityCombobox } from "@/components/CityCombobox";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Field";
import { toast } from "@/components/ui/Toast";
import { useAuth } from "@/features/auth";
import { isValidEmail } from "@/lib/validation";

export function RegisterPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", city: "Москва" });
  const [touched, setTouched] = useState(false);
  const [terms, setTerms] = useState(false);
  const [cookies, setCookies] = useState(false);
  const [reading, setReading] = useState<AgreementKind | null>(null);

  const errors = {
    name: form.name.trim().length < 2 ? "Укажите имя — так вас увидят другие участники" : undefined,
    email: isValidEmail(form.email) ? undefined : "Введите корректный email, например name@mail.ru",
    password: form.password.length < 6 ? "Пароль — минимум 6 символов" : undefined,
    city: form.city ? undefined : "Выберите город из списка",
    terms: terms ? undefined : "Нужно принять пользовательское соглашение",
    cookies: cookies ? undefined : "Нужно согласие на использование cookie",
  };
  const valid = !Object.values(errors).some(Boolean);

  const register = useMutation({
    mutationFn: authApi.register,
    onSuccess: (result) => {
      signIn(result);
      toast.success("Аккаунт создан. Добро пожаловать!");
      navigate("/");
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (valid) register.mutate({ ...form, name: form.name.trim(), email: form.email.trim() });
  };

  const set = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="page-container mt-6 max-w-xl lg:mt-12">
      <Card className="p-6 sm:p-8">
        <h1 className="text-3xl font-bold">Регистрация</h1>
        <p className="mt-2 text-muted">Это займёт минуту. Подтверждать почту не нужно.</p>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4" noValidate>
          <Input label="Имя" autoComplete="name" value={form.name} onChange={set("name")} error={touched ? errors.name : undefined} required />
          <Input label="Email" type="email" autoComplete="email" value={form.email} onChange={set("email")} error={touched ? errors.email : undefined} required />
          <Input
            label="Пароль"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={set("password")}
            hint="Не меньше 6 символов"
            error={touched ? errors.password : undefined}
            required
          />
          <CityCombobox label="Город" value={form.city} onChange={(city) => setForm((f) => ({ ...f, city }))} error={touched ? errors.city : undefined} required />
          <A11yChoice />
          <div className="flex flex-col gap-3">
            <Checkbox checked={terms} onChange={(e) => setTerms(e.target.checked)} error={touched ? errors.terms : undefined}>
              Принимаю{" "}
              <button type="button" onClick={() => setReading("terms")} className="font-medium text-primary underline underline-offset-4">
                пользовательское соглашение
              </button>
            </Checkbox>
            <Checkbox checked={cookies} onChange={(e) => setCookies(e.target.checked)} error={touched ? errors.cookies : undefined}>
              Согласен на использование{" "}
              <button type="button" onClick={() => setReading("cookies")} className="font-medium text-primary underline underline-offset-4">
                файлов cookie
              </button>
            </Checkbox>
          </div>
          {register.isError && (
            <p role="alert" className="rounded-2xl bg-danger px-4 py-3 font-medium text-danger-ink">
              {errorMessage(register.error)}
            </p>
          )}
          <Button type="submit" size="lg" loading={register.isPending}>
            Создать аккаунт
          </Button>
        </form>
        <p className="mt-6 text-muted">
          Уже есть аккаунт?{" "}
          <Link to="/login" className="font-medium text-primary underline underline-offset-4">
            Войти
          </Link>
        </p>
      </Card>
      <AgreementModal kind={reading} onClose={() => setReading(null)} />
    </div>
  );
}
