import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { SportEvent } from "@/api/types";
import { useAccessibility } from "@/features/accessibility";
import { cn } from "@/lib/cn";
import { EventCard, EventCardSkeleton } from "./EventCard";
import { Button } from "./ui/Button";
import { ErrorState } from "./ui/States";

interface EventGridProps {
  events: SportEvent[] | undefined;
  isPending: boolean;
  error: unknown;
  onRetry: () => void;
  isStale?: boolean;
  empty: ReactNode;
  className?: string;
}

const SIMPLE_LIMIT = 6;

const GRID_CLASS = "event-grid grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4";

export function EventGrid({ events, isPending, error, onRetry, isStale, empty, className }: EventGridProps) {
  const { simple } = useAccessibility().settings;
  const [showAll, setShowAll] = useState(false);
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
  const limited = simple && !showAll && events.length > SIMPLE_LIMIT;
  const visible = limited ? events.slice(0, SIMPLE_LIMIT) : events;
  return (
    <>
      <div className={cn(GRID_CLASS, "transition-opacity", isStale && "opacity-60", className)}>
        {visible.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
      {limited && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <p className="text-[17px] text-muted">
            Показано {SIMPLE_LIMIT} из {events.length}
          </p>
          <Button size="lg" variant="secondary" onClick={() => setShowAll(true)} icon={<ChevronDown className="size-5" aria-hidden />}>
            Показать ещё занятия
          </Button>
        </div>
      )}
    </>
  );
}
