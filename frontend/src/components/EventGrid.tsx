import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { SportEvent } from "@/api/types";
import { cn } from "@/lib/cn";
import { EventCard, EventCardSkeleton } from "./EventCard";
import { ErrorState } from "./ui/States";

interface EventGridProps {
  query: UseQueryResult<SportEvent[]>;
  empty: ReactNode;
  className?: string;
}

export const GRID_CLASS = "grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 lg:gap-6";

/** Сетка карточек с состояниями загрузки, ошибки и пустого результата. */
export function EventGrid({ query, empty, className }: EventGridProps) {
  if (query.isPending) {
    return (
      <div className={cn(GRID_CLASS, className)} role="status" aria-label="Загружаем события">
        {Array.from({ length: 4 }, (_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} className={className} />;
  if (query.data.length === 0) return <div className={className}>{empty}</div>;
  return (
    <div className={cn(GRID_CLASS, "transition-opacity", query.isPlaceholderData && "opacity-60", className)}>
      {query.data.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
