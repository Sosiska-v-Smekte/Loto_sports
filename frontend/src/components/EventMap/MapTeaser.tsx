import { useMemo } from "react";
import type { SportEvent } from "@/api/types";
import { toWorldPixels, withCoordinates, type Coordinates } from "./geo";
import styles from "./MapTeaser.module.css";

// Масштаб превью: районы города и улицы читаются, а точки мероприятий не сливаются
const ZOOM = 12;
const TILE = 256;
// Сетка тайлов с запасом под самую широкую плашку (до ~1200px) и её высоту
const COLS = [-3, -2, -1, 0, 1, 2, 3];
const ROWS = [-1, 0, 1];
const MAX_PINS = 30;

interface MapTeaserProps {
  events: SportEvent[] | undefined;
  center: Coordinates;
  city: string;
  onOpen: () => void;
}

export function MapTeaser({ events, center: cityCenter, city, onOpen }: MapTeaserProps) {
  const { tiles, offset, pins, count } = useMemo(() => {
    const points = withCoordinates(events ?? []);
    const center = toWorldPixels(cityCenter, ZOOM);
    const tileX = Math.floor(center.x / TILE);
    const tileY = Math.floor(center.y / TILE);
    const originX = (tileX + COLS[0]) * TILE;
    const originY = (tileY + ROWS[0]) * TILE;
    return {
      tiles: ROWS.flatMap((dy) =>
        COLS.map((dx) => ({ x: tileX + dx, y: tileY + dy, left: (dx - COLS[0]) * TILE, top: (dy - ROWS[0]) * TILE })),
      ),
      offset: { x: center.x - originX, y: center.y - originY },
      pins: points.slice(0, MAX_PINS).map((event) => {
        const p = toWorldPixels([event.latitude, event.longitude], ZOOM);
        return { id: event.id, dx: p.x - center.x, dy: p.y - center.y, color: event.sport.color };
      }),
      count: points.length,
    };
  }, [events, cityCenter]);

  return (
    <button type="button" className={styles.teaser} onClick={onOpen}>
      <span className={styles.tiles} style={{ transform: `translate(${-offset.x}px, ${-offset.y}px)` }} aria-hidden>
        {tiles.map((tile) => (
          <img
            key={`${tile.x}:${tile.y}`}
            src={`https://tile.openstreetmap.org/${ZOOM}/${tile.x}/${tile.y}.png`}
            alt=""
            loading="lazy"
            draggable={false}
            className={styles.tile}
            style={{ left: tile.left, top: tile.top }}
          />
        ))}
      </span>
      {pins.map((pin) => (
        <span
          key={pin.id}
          aria-hidden
          className={styles.pin}
          style={{ left: `calc(50% + ${pin.dx}px)`, top: `calc(50% + ${pin.dy}px)`, backgroundColor: pin.color }}
        />
      ))}
      <span className={styles.shade} aria-hidden />
      <span className={styles.content}>
        <span className={styles.icon} aria-hidden>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </span>
        <span className={styles.text}>
          <span className={styles.title}>
            Карта активностей <span className={styles.city}>· {city}</span>
          </span>
          <span className={styles.subtitle}>Нажмите, чтобы посмотреть активности рядом с собой</span>
          <span className={styles.count}>{count > 0 ? `На карте: ${count}` : "В этом городе пока нет активностей с адресом"}</span>
        </span>
        <span className={styles.cta} aria-hidden>
          Открыть карту
        </span>
      </span>
      <span className={styles.attribution} aria-hidden>
        © OpenStreetMap
      </span>
    </button>
  );
}
