// Названия, которые не склоняются по общим правилам: составные, с беглой гласной, мужской род на «-ь»
const LOCATIVE_EXCEPTIONS: Record<string, string> = {
  "Нижний Новгород": "Нижнем Новгороде",
  "Нижний Тагил": "Нижнем Тагиле",
  "Великий Новгород": "Великом Новгороде",
  "Набережные Челны": "Набережных Челнах",
  "Старый Оскол": "Старом Осколе",
  "Новый Уренгой": "Новом Уренгое",
  "Сергиев Посад": "Сергиевом Посаде",
  "Петропавловск-Камчатский": "Петропавловске-Камчатском",
  "Каменск-Уральский": "Каменске-Уральском",
  Орёл: "Орле",
  Елец: "Ельце",
  Череповец: "Череповце",
  Ярославль: "Ярославле",
  Ставрополь: "Ставрополе",
  Анадырь: "Анадыре",
  Сочи: "Сочи",
};

/** Предложный падеж одного слова названия города по общим правилам. */
function locativeWord(word: string): string {
  if (/(ский|цкий)$/.test(word)) return word.replace(/ий$/, "ом"); // Октябрьский → Октябрьском
  if (/ый$/.test(word)) return word.replace(/ый$/, "ом"); // Грозный → Грозном
  if (/(ки|щи)$/.test(word)) return word.replace(/и$/, "ах"); // Химки → Химках, Мытищи → Мытищах
  if (/ы$/.test(word)) return word.replace(/ы$/, "ах"); // Шахты → Шахтах, Люберцы → Люберцах
  if (/[ая]$/.test(word)) return word.replace(/[ая]$/, "е"); // Москва → Москве, Йошкар-Ола → Йошкар-Оле
  if (/ь$/.test(word)) return word.replace(/ь$/, "и"); // Казань → Казани, Пермь → Перми
  if (/[бвгджзклмнпрстфхцчшщ]$/.test(word)) return `${word}е`; // Красноярск → Красноярске
  return word; // Иваново, Тольятти, Улан-Удэ — не склоняются
}

/** «Красноярск» → «Красноярске», «Ростов-на-Дону» → «Ростове-на-Дону». */
export function cityLocative(city: string): string {
  if (LOCATIVE_EXCEPTIONS[city]) return LOCATIVE_EXCEPTIONS[city];
  const onRiver = city.match(/^(.+?)(-на-.+)$/); // склоняется только часть до «-на-»
  if (onRiver) return locativeWord(onRiver[1]) + onRiver[2];
  return locativeWord(city);
}

export function eventsInCityTitle(city: string): string {
  return `События в ${cityLocative(city)}`;
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
