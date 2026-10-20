import { useMemo } from "react";
import type { SportEvent } from "@/api/types";
import { sportIconSource } from "@/components/SportIllustration";
import { useSportIconUrls } from "@/lib/useSportIconUrls";
import { EventMap } from "./EventMap";
import type { Event, MapProps } from "./types";

export function toMapEvent(event: SportEvent, recolored: Record<string, string> = {}): Event {
  const { src } = sportIconSource(event.sport, true);
  return {
    id: event.id,
    title: event.title,
    sportName: event.sport.name,
    sportIcon: event.sport.icon,
    sportImage: recolored[src] ?? src,
    sportColor: event.sport.color,
    startsAt: event.starts_at,
    address: event.address,
    lat: event.latitude,
    lng: event.longitude,
  };
}

interface MapWrapperProps extends Omit<MapProps, "events"> {
  events: SportEvent[] | undefined;
}

export function MapWrapper({ events, ...props }: MapWrapperProps) {
  const recolored = useSportIconUrls((events ?? []).map((e) => e.sport));
  const mapEvents = useMemo(() => (events ?? []).map((e) => toMapEvent(e, recolored)), [events, recolored]);
  return <EventMap events={mapEvents} {...props} />;
}
