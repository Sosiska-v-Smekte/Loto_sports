/**
 * Гравировка цветной шапки карточки: тонкий линейный узор, как рельеф на фоне страницы.
 * Список совпадает с CARD_PATTERNS в backend/app/schemas/events.py.
 * Размер узора задан в пикселях, а не cover: так линия одной толщины и на карточке, и в большой шапке.
 */
export const CARD_PATTERNS = [
  { id: "topo", name: "Рельеф", src: "/topo.svg", size: "600px", repeat: "repeat" },
  { id: "pitch", name: "Футбольное поле", src: "/engravings/pitch.svg", size: "600px 300px", repeat: "no-repeat" },
  { id: "court", name: "Баскетбольная площадка", src: "/engravings/court.svg", size: "600px 320px", repeat: "no-repeat" },
  { id: "tennis", name: "Теннисный корт", src: "/engravings/tennis.svg", size: "600px 300px", repeat: "no-repeat" },
  { id: "track", name: "Беговая дорожка", src: "/engravings/track.svg", size: "600px 300px", repeat: "repeat-x" },
  { id: "lanes", name: "Бассейн", src: "/engravings/lanes.svg", size: "160px 64px", repeat: "repeat" },
  { id: "waves", name: "Волны", src: "/engravings/waves.svg", size: "120px 40px", repeat: "repeat" },
  { id: "net", name: "Сетка", src: "/engravings/net.svg", size: "28px", repeat: "repeat" },
  { id: "chess", name: "Шахматная доска", src: "/engravings/chess.svg", size: "56px", repeat: "repeat" },
  { id: "balls", name: "Мячи", src: "/engravings/balls.svg", size: "140px", repeat: "repeat" },
] as const;

export type CardPattern = (typeof CARD_PATTERNS)[number]["id"];
export type CardPatternInfo = (typeof CARD_PATTERNS)[number];

export const findPattern = (id: string | null | undefined): CardPatternInfo | undefined =>
  CARD_PATTERNS.find((p) => p.id === id);

/** Узор, который подходит направлению: его показываем в выборе первым. */
export const SPORT_PATTERN: Record<string, CardPattern> = {
  football: "pitch",
  basketball: "court",
  tennis: "tennis",
  "table-tennis": "tennis",
  badminton: "tennis",
  volleyball: "net",
  hockey: "net",
  running: "track",
  cycling: "track",
  swimming: "lanes",
  yoga: "waves",
  chess: "chess",
  bowling: "balls",
};
