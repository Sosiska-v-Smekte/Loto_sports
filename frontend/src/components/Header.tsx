import { Plus } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAccessibility } from "@/features/accessibility";
import { useAuth } from "@/features/auth";
import { cn } from "@/lib/cn";
import { AccessibilityButton } from "./AccessibilityMenu";
import { AccountMenu } from "./AccountMenu";
import { NotificationBell } from "./NotificationBell";
import { isNavActive, NAV_ITEMS } from "./nav";
import { ButtonLink } from "./ui/Button";

export function Header() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || user?.is_admin);
  // У админа лишний пункт «Админка»: вместе с кнопками доступности и уведомлений полные подписи
  // не помещаются ни на одной ширине, поэтому у него всегда короткие («Найти», «Мои»…)
  const compact = Boolean(user?.is_admin);
  // Простой режим: у пунктов всегда значок, подпись как обычно (короткая, если полная не помещается)
  const { simple } = useAccessibility().settings;

  return (
    <header data-site-header className="sticky top-0 z-30 border-b border-line/70 bg-[#f7f2e8]/90 shadow-[0_6px_20px_-10px_rgb(110_84_46/0.3)] backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-3 px-4 sm:px-6 lg:h-[84px] xl:px-10">
        <Link
          data-logo
          to="/"
          className="min-w-0 truncate whitespace-nowrap rounded-lg text-[20px] font-semibold leading-[1.15] tracking-[-0.01em] sm:shrink-0 sm:text-[22px] lg:text-[24px] xl:text-[28px]"
        >
          Спортивный клуб
        </Link>

        <nav data-desktop-nav aria-label="Основная навигация" className="ml-4 hidden items-center gap-2 lg:flex xl:ml-8 xl:gap-2.5">
          {items.map((item) => {
            const active = isNavActive(item.to, pathname);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={cn(
                  "pressable inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-[15px] font-medium xl:min-h-[50px] xl:px-5 xl:text-[17px]",
                  active
                    ? "neu-primary border-primary bg-primary text-white"
                    : "neu-control border-line/70 bg-surface-muted text-ink",
                )}
              >
                {/* В простом режиме значки у всех пунктов; на узком десктопе (1024–1279) — только у активного,
                    иначе у админа с четырьмя пунктами шапка не помещается */}
                {(active || simple) && <item.icon className={active ? "size-5" : "hidden size-5 xl:block"} aria-hidden />}
                <span data-label-short className={compact ? undefined : simple ? "2xl:hidden" : "xl:hidden"}>
                  {item.shortLabel}
                </span>
                <span data-label-full className={compact ? "hidden" : simple ? "hidden 2xl:inline" : "hidden xl:inline"}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 xl:gap-3">
          <ButtonLink
            data-desktop-nav
            to="/events/new"
            className="hidden whitespace-nowrap lg:inline-flex xl:min-h-[50px] xl:px-5 xl:text-[17px]"
            icon={<Plus className="size-5" aria-hidden />}
          >
            <span data-label-short className="wide:hidden">
              Создать
            </span>
            <span data-label-full className="hidden wide:inline">
              Создать активность
            </span>
          </ButtonLink>
          <AccessibilityButton />
          {user && <NotificationBell />}
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
