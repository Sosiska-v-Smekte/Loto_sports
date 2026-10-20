import "leaflet/dist/leaflet.css";
import L, { type LatLngTuple, type LeafletMouseEvent, type MarkerCluster, type PointTuple } from "leaflet";
import { useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
// Пакет сам подключает CSS кластеров (MarkerCluster.css, MarkerCluster.Default.css)
import MarkerClusterGroup from "react-leaflet-cluster";
import styles from "./EventMap.module.css";
import { KRASNOYARSK } from "./geo";
import type { Event, MapProps } from "./types";

export const KRASNOYARSK_CENTER: LatLngTuple = KRASNOYARSK;
const DEFAULT_ZOOM = 12;
const DEFAULT_COLOR = "#1F4F47"; // фирменный тёмно-зелёный
const DEFAULT_ICON = "🏅"; // нейтральная иконка для направлений без своей
// Точность группировки «одно место»: 5 знаков ≈ 1 метр
const PLACE_PRECISION = 5;

interface Place {
  key: string;
  lat: number;
  lng: number;
  address: string;
  events: Event[];
}

/** В иконке храним число мероприятий, чтобы кластер показывал их общее количество, а не число маркеров. */
interface CountedIconOptions extends L.DivIconOptions {
  eventCount: number;
}

const hasCoordinates = (e: Event): e is Event & { lat: number; lng: number } =>
  typeof e.lat === "number" && typeof e.lng === "number" && Number.isFinite(e.lat) && Number.isFinite(e.lng);

/** Мероприятия по одному адресу объединяются в один маркер со списком и счётчиком «+N». */
function groupByPlace(events: Event[]): { places: Place[]; withoutCoordinates: number } {
  const places = new Map<string, Place>();
  let withoutCoordinates = 0;
  for (const event of events) {
    if (!hasCoordinates(event)) {
      withoutCoordinates += 1;
      continue;
    }
    const key = `${event.lat.toFixed(PLACE_PRECISION)},${event.lng.toFixed(PLACE_PRECISION)}`;
    const place = places.get(key) ?? { key, lat: event.lat, lng: event.lng, address: event.address, events: [] };
    place.events.push(event);
    places.set(key, place);
  }
  for (const place of places.values()) {
    place.events.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }
  return { places: [...places.values()], withoutCoordinates };
}

// divIcon вставляет строку как HTML, поэтому всё пришедшее из данных экранируем
const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

const safeColor = (color: string | undefined) => (color && /^#[0-9a-f]{3,8}$/i.test(color) ? color : DEFAULT_COLOR);

/** Иконка направления: 3D-картинка из каталога, а если её нет — эмодзи. */
const markerGlyph = (event: Event) =>
  event.sportImage
    ? `<img src="${escapeHtml(event.sportImage)}" alt="" width="28" height="28" draggable="false" />`
    : escapeHtml(event.sportIcon || DEFAULT_ICON);

function placeIcon(place: Place): L.DivIcon {
  const first = place.events[0];
  const extra = place.events.length - 1;
  const options: CountedIconOptions = {
    className: styles.markerRoot,
    // Круглая «булавка»: кружок в цвете направления с иконкой и хвостик, указывающий на точку
    html: `
      <div class="${styles.marker}" style="--marker-color:${safeColor(first.sportColor)}">
        <svg class="${styles.markerShape}" viewBox="0 0 44 52" aria-hidden="true">
          <path d="M22 51 L13 38 A20 20 0 1 1 31 38 Z" />
        </svg>
        <span class="${styles.markerIcon}">${markerGlyph(first)}</span>
        ${extra > 0 ? `<span class="${styles.markerBadge}">+${extra}</span>` : ""}
      </div>`,
    iconSize: [44, 52],
    iconAnchor: [22, 51],
    popupAnchor: [0, -46],
    eventCount: place.events.length,
  };
  return L.divIcon(options);
}

function clusterIcon(cluster: MarkerCluster): L.DivIcon {
  const total = cluster
    .getAllChildMarkers()
    .reduce((sum, marker) => sum + ((marker.options.icon?.options as Partial<CountedIconOptions>)?.eventCount ?? 1), 0);
  return L.divIcon({
    className: styles.markerRoot,
    html: `<div class="${styles.cluster}"><span>${total}</span></div>`,
    iconSize: [48, 48],
  });
}

const timeFormat = new Intl.DateTimeFormat("ru-RU", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function formatStart(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : timeFormat.format(date);
}

// Кнопки масштаба Leaflet в левом верхнем углу лежат выше попапа: при автопрокрутке держим от них отступ
const POPUP_PADDING_TOP_LEFT: PointTuple = [64, 16];
const POPUP_PADDING_BOTTOM_RIGHT: PointTuple = [16, 16];

// Внутренние поля попапа Leaflet (content margin + рамка)
const POPUP_CHROME = 32;

/** Попап не шире самой карты (а не окна): с учётом отступа под кнопки масштаба и полей по краям */
function usePopupMaxWidth(): number {
  const mapWidth = useMap().getSize().x;
  const available = mapWidth - POPUP_PADDING_TOP_LEFT[0] - POPUP_PADDING_BOTTOM_RIGHT[0] - POPUP_CHROME;
  return Math.max(180, Math.min(320, available));
}

function placeLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? "мероприятие"
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? "мероприятия"
        : "мероприятий";
  return `${count} ${word} по этому адресу`;
}

function PlaceCard({ place, onEventSelect }: { place: Place; onEventSelect: MapProps["onEventSelect"] }) {
  const several = place.events.length > 1;
  return (
    <div className={styles.card}>
      <p className={styles.cardAddress}>{place.address}</p>
      {several && <p className={styles.cardCount}>{placeLabel(place.events.length)}</p>}
      <ul className={styles.cardList}>
        {place.events.map((event) => (
          <li key={event.id}>
            <button type="button" className={styles.cardItem} onClick={() => onEventSelect(event.id)}>
              <span className={styles.cardIcon} style={{ backgroundColor: safeColor(event.sportColor) }} aria-hidden>
                {event.sportImage ? <img src={event.sportImage} alt="" width={28} height={28} draggable={false} /> : event.sportIcon || DEFAULT_ICON}
              </span>
              <span className={styles.cardText}>
                <span className={styles.cardTitle}>{event.title}</span>
                <span className={styles.cardMeta}>
                  {event.sportName} · {formatStart(event.startsAt)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface PlaceMarkerProps {
  place: Place;
  icon: L.DivIcon;
  onEventSelect: MapProps["onEventSelect"];
}

function PlaceMarker({ place, icon, onEventSelect }: PlaceMarkerProps) {
  const maxWidth = usePopupMaxWidth();
  return (
    <Marker
      position={[place.lat, place.lng]}
      icon={icon}
      title={place.events.length > 1 ? placeLabel(place.events.length) : place.events[0].title}
      eventHandlers={{
        // Наведение открывает карточку. Сам попап не закрываем на mouseout, иначе до кнопок в нём не дотянуться
        mouseover: (e: LeafletMouseEvent) => e.target.openPopup(),
        // Leaflet переключает попап по клику: если он уже открыт наведением, клик бы его закрыл.
        // Открываем его заново после встроенного обработчика — клик и тап всегда показывают карточку
        click: (e: LeafletMouseEvent) => window.setTimeout(() => e.target.openPopup(), 0),
      }}
    >
      <Popup
        maxWidth={maxWidth}
        autoPanPaddingTopLeft={POPUP_PADDING_TOP_LEFT}
        autoPanPaddingBottomRight={POPUP_PADDING_BOTTOM_RIGHT}
        className={styles.popup}
      >
        <PlaceCard place={place} onEventSelect={onEventSelect} />
      </Popup>
    </Marker>
  );
}

/**
 * Карта мероприятий на Leaflet + OpenStreetMap: без ключей и платных сервисов.
 * Данные — только из пропсов, наружу — только onEventSelect(id); роутинг делает родитель.
 */
export function EventMap({ events, onEventSelect, center = KRASNOYARSK_CENTER, zoom = DEFAULT_ZOOM, className }: MapProps) {
  const { places, withoutCoordinates } = useMemo(() => groupByPlace(events), [events]);
  const icons = useMemo(() => new Map(places.map((place) => [place.key, placeIcon(place)])), [places]);

  return (
    <div className={[styles.root, className].filter(Boolean).join(" ")}>
      <MapContainer
        center={center}
        zoom={zoom}
        className={styles.map}
        // Колесо мыши не зумит карту, чтобы страница прокручивалась как обычно; масштаб — кнопками и жестами
        scrollWheelZoom={false}
        // Подпись в углу карты (с флагом в префиксе Leaflet) скрыта по просьбе заказчика
        attributionControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MarkerClusterGroup chunkedLoading iconCreateFunction={clusterIcon} showCoverageOnHover={false} maxClusterRadius={50}>
          {places.map((place) => (
            <PlaceMarker key={place.key} place={place} icon={icons.get(place.key)!} onEventSelect={onEventSelect} />
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {places.length === 0 && (
        <div className={styles.overlay} role="status">
          {withoutCoordinates > 0
            ? `Мероприятий без координат: ${withoutCoordinates} — на карте их не видно`
            : "Нет мероприятий для показа на карте"}
        </div>
      )}
      {places.length > 0 && withoutCoordinates > 0 && (
        <div className={styles.note} role="status">
          Без координат и не показано на карте: {withoutCoordinates}
        </div>
      )}
    </div>
  );
}
