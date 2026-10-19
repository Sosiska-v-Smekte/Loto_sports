import { Plus } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { cn } from "@/lib/cn";
import { AccountMenu } from "./AccountMenu";
import { isNavActive, NAV_ITEMS } from "./nav";
import { ButtonLink } from "./ui/Button";

export function Header() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || user?.is_admin);

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-[#f7f2e8]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-3 px-4 sm:px-6 lg:h-[84px] xl:px-10">
        <Link
          to="/"
          className="shrink-0 whitespace-nowrap rounded-lg text-[22px] font-semibold tracking-[-0.01em] lg:text-[24px] xl:text-[28px] 2xl:text-[30px]"
        >
          Спортивный клуб
        </Link>

        <nav aria-label="Основная навигация" className="ml-4 hidden items-center gap-2 lg:flex xl:ml-8 xl:gap-2.5 2xl:ml-12">
          {items.map((item) => {
            const active = isNavActive(item.to, pathname);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={cn(
                  "pressable inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-[15px] font-medium xl:min-h-[50px] xl:px-5 xl:text-[17px] 2xl:px-6 2xl:text-[18px]",
                  active
                    ? "border-primary bg-primary text-white shadow-soft"
                    : "border-line bg-surface-muted text-ink hover:bg-white",
                )}
              >
                {active && <item.icon className="size-5" aria-hidden />}
                <span className="xl:hidden">{item.shortLabel}</span>
                <span className="hidden xl:inline">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 xl:gap-3">
          <ButtonLink
            to="/events/new"
            className="hidden whitespace-nowrap lg:inline-flex xl:min-h-[50px] xl:px-5 xl:text-[17px] 2xl:px-6 2xl:text-[18px]"
            icon={<Plus className="size-5" aria-hidden />}
          >
            <span className="wide:hidden">Создать</span>
            <span className="hidden wide:inline">Создать активность</span>
          </ButtonLink>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
