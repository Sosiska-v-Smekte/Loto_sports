import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { errorMessage } from "@/api/client";
import { authApi } from "@/api/endpoints";
import type { AuthResult } from "@/api/types";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { toast } from "@/components/ui/Toast";
import { useAuth } from "@/features/auth";
import { cn } from "@/lib/cn";

export function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const demo = useQuery({ queryKey: ["demo-accounts"], queryFn: authApi.demoAccounts, staleTime: Infinity });

  const onSuccess = (result: AuthResult) => {
    signIn(result);
    toast.success(`Вы вошли как ${result.user.name}`);
    navigate(next, { replace: true });
  };

  const login = useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      authApi.login(credentials.email, credentials.password),
    onSuccess,
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <div className="page-container mt-6 grid max-w-5xl gap-6 lg:mt-12 lg:grid-cols-[1fr_1.15fr] lg:gap-10">
      <Card className="p-6 sm:p-8">
        <h1 className="text-3xl font-bold">Вход</h1>
        <p className="mt-2 text-muted">Войдите, чтобы записываться на активности и создавать свои.</p>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4" noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Пароль"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {login.isError && (
            <p role="alert" className="rounded-2xl bg-danger px-4 py-3 font-medium text-danger-ink">
              {errorMessage(login.error)}
            </p>
          )}
          <Button type="submit" size="lg" loading={login.isPending} disabled={!email || !password}>
            Войти
          </Button>
        </form>
        <p className="mt-6 text-muted">
          Нет аккаунта?{" "}
          <Link to="/register" className="font-medium text-primary underline underline-offset-4">
            Зарегистрироваться
          </Link>
        </p>
      </Card>

      <section aria-labelledby="demo-title">
        <h2 id="demo-title" className="text-2xl font-semibold">
          Демо-доступ
        </h2>
        <p className="mt-1 text-muted">
          Вход в один клик. Пароль у всех аккаунтов — <span className="font-medium text-ink">demo1234</span>.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {demo.isPending &&
            Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[104px] rounded-card" />)}
          {demo.isError && <ErrorState error={demo.error} onRetry={() => demo.refetch()} className="sm:col-span-2" />}
          {demo.data?.map((account) => {
            const current = user?.email === account.email;
            const pending = login.isPending && login.variables?.email === account.email;
            return (
              <button
                key={account.email}
                type="button"
                disabled={login.isPending}
                onClick={() => login.mutate({ email: account.email, password: account.password })}
                className={cn(
                  "lift pressable flex items-start gap-3 neu-raised-sm rounded-card border border-white/70 bg-surface p-4 text-left disabled:opacity-60",
                  current ? "border-primary ring-2 ring-primary/25" : "border-line",
                )}
              >
                <Avatar name={account.name} id={account.email.length} size="md" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 font-semibold">
                    {account.name}
                    {current && <CheckCircle2 className="size-4 text-primary" aria-label="текущий аккаунт" />}
                  </span>
                  <span className="mt-0.5 block text-sm font-medium text-primary">{account.role}</span>
                  <span className="mt-1 block text-sm leading-snug text-muted">{account.description}</span>
                </span>
                <ArrowRight
                  className={cn("mt-1 size-5 shrink-0 text-muted", pending && "animate-pulse text-primary")}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
