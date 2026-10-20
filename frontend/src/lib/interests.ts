import type { DayKind, DayPart } from "@/api/types";

export const DAY_KIND_LABEL: Record<DayKind, string> = { weekday: "в будни", weekend: "в выходные" };
export const DAY_KIND_TITLE: Record<DayKind, string> = { weekday: "Будни", weekend: "Выходные" };
export const DAY_PART_LABEL: Record<DayPart, string> = { morning: "утром", day: "днём", evening: "вечером" };
export const DAY_PART_TITLE: Record<DayPart, string> = {
  morning: "Утром (до 12:00)",
  day: "Днём (12:00–18:00)",
  evening: "Вечером (после 18:00)",
};
/** Время начала по умолчанию в черновике встречи */
export const DAY_PART_TIME: Record<DayPart, string> = { morning: "10:00", day: "14:00", evening: "19:00" };

/** «3 человека», «5 человек»: склонение по числу */
export const peopleCount = (n: number) => {
  const tail = n % 100;
  const last = n % 10;
  const word = tail >= 11 && tail <= 14 ? "человек" : last === 1 ? "человек" : last >= 2 && last <= 4 ? "человека" : "человек";
  return `${n} ${word}`;
};
