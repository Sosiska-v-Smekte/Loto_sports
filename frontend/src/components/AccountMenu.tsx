import { LogIn, LogOut, RefreshCw, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { cn } from "@/lib/cn";
import { Avatar } from "./ui/Avatar";
import { ButtonLink } from "./ui/Button";
import { toast } from "./ui/Toast";

function roleLabel(isAdmin: boolean, orgStatus: string | undefined) {
  if (isAdmin) return "Администратор";
  if (orgStatus === "approved") return "Организация";
  return "Пользователь";
}

export function AccountMenu({ compact = false }: { compact?: boolean }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <ButtonLink to="/login" variant="secondary" size="sm" icon={<LogIn className="size-4" aria-hidden />}>
        Войти
      </ButtonLink>
    );
  }

  const logout = async () => {
    setOpen(false);
    await signOut();
    toast.success("Вы вышли из аккаунта");
    navigate("/");
  };

  const itemClass =
    "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left font-medium hover:bg-surface-muted";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Аккаунт: ${user.name}`}
        className={cn(
          "pressable flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface-muted py-1 pl-1 pr-1 hover:bg-white",
          compact ? "2xl:pr-4" : "wide:pr-4",
        )}
      >
        <Avatar name={user.name} id={user.id} src={user.avatar_url} size="sm" className="size-9" />
        <span className={cn("hidden max-w-[9rem] truncate text-[15px] font-medium", compact ? "2xl:inline" : "wide:inline")}>
          {user.name}
        </span>
      </button>

      <div
        role="menu"
        className={cn(
          "absolute right-0 top-[calc(100%+8px)] w-72 origin-top-right rounded-2xl border border-line bg-surface p-2 shadow-pop",
          "transition-[opacity,transform] duration-150 ease-out",
          open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0",
        )}
      >
        <div className="px-3 pb-3 pt-2">
          <p className="text-sm text-muted">Вы вошли как</p>
          <p className="truncate font-semibold">{user.name}</p>
          <p className="truncate text-sm text-muted">
            {roleLabel(user.is_admin, user.organization?.status)} · {user.email}
          </p>
        </div>
        <div className="border-t border-line pt-2">
          <Link role="menuitem" to="/profile" className={itemClass} onClick={() => setOpen(false)}>
            <UserRound className="size-5" aria-hidden /> Профиль
          </Link>
          {user.is_admin && (
            <Link role="menuitem" to="/admin" className={itemClass} onClick={() => setOpen(false)}>
              <ShieldCheck className="size-5" aria-hidden /> Админка
            </Link>
          )}
          <Link role="menuitem" to="/login" className={itemClass} onClick={() => setOpen(false)}>
            <RefreshCw className="size-5" aria-hidden /> Сменить аккаунт
          </Link>
          <button role="menuitem" type="button" className={itemClass} onClick={logout}>
            <LogOut className="size-5" aria-hidden /> Выйти
          </button>
        </div>
      </div>
    </div>
  );
}
