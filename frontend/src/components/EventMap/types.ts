import type { LatLngTuple } from "leaflet";

/**
 * Мероприятие в том виде, в каком его ждёт карта.
 * Карта не знает об API и не грузит данные сама — родитель передаёт уже готовый массив.
 * Координаты необязательны: мероприятия без них не рисуются, а их количество показывается подсказкой на карте.
 */
export interface Event {
  id: number | string;
  title: string;
  /** Название вида спорта: «Футбол», «Шахматы»… */
  sportName: string;
  /** Иконка вида спорта (эмодзи из каталога направлений). Если нет — нейтральная иконка */
  sportIcon?: string;
  /** Картинка направления (3D-иконка из каталога). Если есть, показывается вместо эмодзи */
  sportImage?: string;
  /** Цвет направления в формате #RRGGBB — фон маркера. Если нет — фирменный зелёный */
  sportColor?: string;
  /** Дата и время начала в ISO 8601 */
  startsAt: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
}

export interface MapProps {
  events: Event[];
  /** Клик по мероприятию в карточке. Роутинг — забота родителя */
  onEventSelect: (eventId: Event["id"]) => void;
  /** По умолчанию — центр Красноярска */
  center?: LatLngTuple;
  /** По умолчанию — 12 */
  zoom?: number;
  className?: string;
}
