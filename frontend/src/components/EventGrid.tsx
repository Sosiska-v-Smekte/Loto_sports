import type { ReactNode } from "react";
import type { SportEvent } from "@/api/types";
import { cn } from "@/lib/cn";
import { EventCard, EventCardSkeleton } from "./EventCard";
import { ErrorState } from "./ui/States";

interface EventGridProps {
  events: SportEvent[] | undefined;
  isPending: boolean;
  error: unknown;
  onRetry: () => void;
  /** Показываются прошлые результаты, пока грузятся новые (смена фильтра) */
  isStale?: boolean;
  empty: ReactNode;
  className?: string;
}

const GRID_CLASS = "grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 lg:gap-6";

/** Сетка карточек с состояниями загрузки, ошибки и пустого результата. */
export function EventGrid({ events, isPending, error, onRetry, isStale, empty, className }: EventGridProps) {
  if (isPending) {
    return (
      <div className={cn(GRID_CLASS, className)} role="status" aria-label="Загружаем события">
        {Array.from({ length: 4 }, (_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (error || !events) return <ErrorState error={error} onRetry={onRetry} className={className} />;
  if (events.length === 0) return <div className={className}>{empty}</div>;
  return (
    <div className={cn(GRID_CLASS, "transition-opacity", isStale && "opacity-60", className)}>
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
