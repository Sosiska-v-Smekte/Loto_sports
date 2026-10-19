/** «Москва» → «Москве» для заголовка «События в …». Для неизвестных городов — нейтральная форма. */
const LOCATIVE: Record<string, string> = {
  Москва: "Москве",
  "Санкт-Петербург": "Санкт-Петербурге",
  Казань: "Казани",
  Новосибирск: "Новосибирске",
  Екатеринбург: "Екатеринбурге",
};

export function eventsInCityTitle(city: string): string {
  return LOCATIVE[city] ? `События в ${LOCATIVE[city]}` : `События: ${city}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function pluralize(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
