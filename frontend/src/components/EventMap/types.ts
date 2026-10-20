import type { LatLngTuple } from "leaflet";

export interface Event {
  id: number | string;
  title: string;
  sportName: string;
  sportIcon?: string;
  sportImage?: string;
  sportColor?: string;
  /** Дата и время начала в ISO 8601 */
  startsAt: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
}

export interface MapProps {
  events: Event[];
  onEventSelect: (eventId: Event["id"]) => void;
  /** По умолчанию центр Красноярска */
  center?: LatLngTuple;
  /** По умолчанию 12 */
  zoom?: number;
  className?: string;
}
