/** Без зависимости от Leaflet: используется превью карты до загрузки её кода. */

export type Coordinates = [lat: number, lng: number];

export const KRASNOYARSK: Coordinates = [56.0106, 92.8526];

interface WithCoordinates {
  latitude: number | null;
  longitude: number | null;
}

export function withCoordinates<T extends WithCoordinates>(events: T[]): (T & { latitude: number; longitude: number })[] {
  return events.filter((e): e is T & { latitude: number; longitude: number } => e.latitude !== null && e.longitude !== null);
}

export function centerOf(events: WithCoordinates[]): Coordinates {
  const points = withCoordinates(events);
  if (points.length === 0) return KRASNOYARSK;
  const lat = points.reduce((sum, e) => sum + e.latitude, 0) / points.length;
  const lng = points.reduce((sum, e) => sum + e.longitude, 0) / points.length;
  return [lat, lng];
}

/** Пиксельные координаты точки в проекции Web Mercator (как у тайлов OpenStreetMap) на заданном масштабе. */
export function toWorldPixels([lat, lng]: Coordinates, zoom: number): { x: number; y: number } {
  const scale = 256 * 2 ** zoom;
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}
