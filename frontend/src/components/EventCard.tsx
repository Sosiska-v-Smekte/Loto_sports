import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import type { SportEvent } from "@/api/types";
import { eventPalette } from "@/lib/color";
import { formatEventDate } from "@/lib/dates";
import { JOIN_MODE_LABEL, LEVEL_LABEL, organizerKind } from "@/lib/status";
import { Engraving } from "./Engraving";
import { SportIllustration } from "./SportIllustration";
import { JOIN_MODE_ICON, StatusBadge } from "./StatusBadge";
import { Avatar } from "./ui/Avatar";
import { Skeleton } from "./ui/Skeleton";
import { Tag } from "./ui/Tag";

/** Короткое название места: «Манеж «Запад», ул. …» → «Манеж «Запад»». */
const shortPlace = (address: string) => address.split(",")[0];

export function EventCard({ event }: { event: SportEvent }) {
  const ModeIcon = JOIN_MODE_ICON[event.join_mode];
  const palette = eventPalette(event);

  return (
    <article className="neu-raised lift group relative flex flex-col rounded-card border border-line/70 bg-surface p-2.5">
      <div
        className="tinted-3d relative isolate h-[168px] overflow-hidden rounded-[18px] px-4 pt-3.5"
        style={{ backgroundColor: palette.background }}
      >
        <Engraving pattern={event.card_pattern} />
        <h3 className="line-clamp-2 text-[20px] font-medium leading-[1.12] tracking-[-0.01em]">
          <Link
            to={`/events/${event.id}`}
            className="rounded-sm after:absolute after:inset-0 after:z-10 after:rounded-card after:content-[''] focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-[3px] focus-visible:after:outline-primary"
          >
            {event.title}
          </Link>
        </h3>
        <SportIllustration
          sport={event.sport}
          tint={palette.tint}
          className="absolute bottom-1.5 right-2 text-[100px] transition-transform duration-300 ease-out group-hover:-translate-y-1.5 group-hover:rotate-[-6deg]"
        />
      </div>

      <div className="flex flex-1 flex-col px-3 pb-2 pt-3">
        <p className="truncate text-lg font-medium">{organizerKind(event)}</p>
        <p className="mt-2 flex items-center gap-2 text-[15px]">
          <CalendarDays className="size-[18px] shrink-0 text-muted" aria-hidden />
          {formatEventDate(event.starts_at)}
        </p>
        <p className="mt-1.5 flex min-w-0 items-center gap-2 text-[15px]">
          <MapPin className="size-[18px] shrink-0 text-muted" aria-hidden />
          <span className="min-w-0 truncate">
            {shortPlace(event.address)} • {event.organizer.name}
          </span>
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Tag tone="level">{LEVEL_LABEL[event.level]}</Tag>
          <Tag tone={event.join_mode === "open" ? "success" : "info"} icon={ModeIcon}>
            {JOIN_MODE_LABEL[event.join_mode]}
          </Tag>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <span className="flex min-w-0 items-center gap-2">
            <Avatar name={event.organizer.name} id={event.organizer.id} src={event.organizer.avatar_url} />
            <span className="truncate text-[15px] font-medium">{event.organizer.name}</span>
          </span>
          {event.my_participation && (
            <StatusBadge status={event.my_participation.status} eventStatus={event.status} className="min-w-0" />
          )}
        </div>
        {/* Простой режим: явная «кнопка» вместо неочевидной кликабельной карточки */}
        <span
          data-simple-only
          aria-hidden
          className="neu-primary mt-4 min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 text-[17px] font-semibold text-white"
        >
          Подробнее и запись
          <ArrowRight className="size-5" />
        </span>
      </div>
    </article>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="neu-raised rounded-card border border-line/70 bg-surface p-2.5" aria-hidden>
      <Skeleton className="h-[168px] rounded-[18px]" />
      <div className="space-y-2.5 px-3 pb-2 pt-4">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
    </div>
  );
}
