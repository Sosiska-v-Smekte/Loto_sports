import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { SportEvent } from "@/api/types";
import { useCityCenters } from "@/features/events";
import { centerOf, type Coordinates } from "./geo";
import styles from "./HomeMapSection.module.css";
import { MapTeaser } from "./MapTeaser";

// Leaflet и тайлы грузятся только после нажатия на плашку — главная не становится тяжелее
const MapWrapper = lazy(() => import("./MapWrapper").then((module) => ({ default: module.MapWrapper })));

// Город целиком: мероприятия разбросаны по районам, на 12-м масштабе часть ушла бы за край
const OPEN_ZOOM = 11;

interface HomeMapSectionProps {
  /** Те же мероприятия, что в списке на главной, — фильтры по городу, дате и направлению действуют и на карту */
  events: SportEvent[] | undefined;
  /** При смене города карта пересоздаётся, чтобы встать по центру нового города */
  city: string;
  onEventSelect: (eventId: number) => void;
}

export function HomeMapSection({ events, city, onEventSelect }: HomeMapSectionProps) {
  const [open, setOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const centers = useCityCenters();
  // Центр выбранного города; если его нет в справочнике центров — середина точек мероприятий
  const center: Coordinates = useMemo(() => centers.data?.[city] ?? centerOf(events ?? []), [centers.data, city, events]);

  useEffect(() => {
    if (open) sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [open]);

  if (!open) return <MapTeaser events={events} center={center} city={city} onOpen={() => setOpen(true)} />;

  return (
    <section ref={sectionRef} aria-label="Карта активностей" className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Карта активностей · {city}</h2>
        <button type="button" className={styles.close} onClick={() => setOpen(false)}>
          Свернуть карту
        </button>
      </div>
      <Suspense fallback={<div className={styles.loading}>Загружаем карту…</div>}>
        <MapWrapper
          // Пересоздаём карту при смене города или когда подгрузился центр — чтобы встать по центру города
          key={`${city}:${center.join(",")}`}
          events={events}
          center={center}
          zoom={OPEN_ZOOM}
          onEventSelect={(id) => onEventSelect(Number(id))}
        />
      </Suspense>
    </section>
  );
}
