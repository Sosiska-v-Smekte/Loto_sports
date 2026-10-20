import { Link } from "react-router-dom";
import type { SportEvent } from "@/api/types";
import { useColorSafe } from "@/features/accessibility";
import { eventPalette } from "@/lib/color";
import { formatEventDate } from "@/lib/dates";
import { LEVEL_LABEL } from "@/lib/status";
import { Engraving } from "./Engraving";
import { SportIllustration } from "./SportIllustration";
import { StatusBadge } from "./StatusBadge";
import { buttonClass } from "./ui/Button";
import { Skeleton } from "./ui/Skeleton";
import { Tag } from "./ui/Tag";

/** Баннер ближайшего события со свободной записью. Кнопка ведёт на страницу события: условия нужно прочитать до записи. */
export function FeaturedBanner({ event }: { event: SportEvent }) {
  const participation = event.my_participation;
  const palette = eventPalette(event, useColorSafe());
  return (
    <section
      aria-label="Ближайшая активность"
      className="tinted-3d relative isolate flex flex-col gap-4 overflow-hidden rounded-card px-5 py-5 [box-shadow:var(--shadow-card)] sm:flex-row sm:items-center sm:gap-6 sm:px-6 sm:py-4"
      style={{ backgroundColor: palette.background }}
    >
      <Engraving pattern={event.card_pattern} />
      <div className="min-w-0 flex-1 pr-20 sm:pr-0">
        <h2 className="text-[22px] font-medium leading-tight tracking-[-0.01em] sm:text-[28px]">{event.title}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[17px]">
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-[2px] bg-ink" aria-hidden />
            {formatEventDate(event.starts_at)}
          </span>
          <span aria-hidden className="hidden sm:inline">
            •
          </span>
          <Tag tone="level" className="bg-white/45">
            {LEVEL_LABEL[event.level]}
          </Tag>
          {participation && <StatusBadge status={participation.status} eventStatus={event.status} />}
        </div>
      </div>
      <SportIllustration
        sport={event.sport}
        className="absolute right-4 top-4 text-[64px] sm:static sm:mr-6 sm:text-[96px] lg:mr-16 lg:text-[104px]"
      />
      <Link to={`/events/${event.id}`} className={buttonClass("primary", "lg", "shrink-0 sm:min-w-[230px]")}>
        {participation || event.can_manage ? "Открыть" : "Присоединиться"}
      </Link>
    </section>
  );
}

export function FeaturedBannerSkeleton() {
  return <Skeleton className="h-[112px] w-full rounded-card" />;
}
