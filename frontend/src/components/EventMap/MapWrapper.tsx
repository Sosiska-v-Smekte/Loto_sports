import { useMemo } from "react";
import type { SportEvent } from "@/api/types";
import { EventMap } from "./EventMap";
import type { Event, MapProps } from "./types";

export function toMapEvent(event: SportEvent): Event {
  return {
    id: event.id,
    title: event.title,
    sportName: event.sport.name,
    sportIcon: event.sport.icon,
    sportColor: event.sport.color,
    startsAt: event.starts_at,
    address: event.address,
    lat: event.latitude,
    lng: event.longitude,
  };
}

interface MapWrapperProps extends Omit<MapProps, "events"> {
  /** Мероприятия в формате API приложения — например, results из useEvents() на главной */
  events: SportEvent[] | undefined;
}

/**
 * Точка встраивания: принимает мероприятия из API как есть.
 * Переход на страницу мероприятия — через onEventSelect, его передаёт родитель (например, navigate(`/events/${id}`)).
 */
export function MapWrapper({ events, ...props }: MapWrapperProps) {
  const mapEvents = useMemo(() => (events ?? []).map(toMapEvent), [events]);
  return <EventMap events={mapEvents} {...props} />;
}
