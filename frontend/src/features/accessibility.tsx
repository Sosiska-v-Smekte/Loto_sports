import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useHoverSpeech } from "./speech";

export type TextSize = 0 | 1 | 2;

export type ColorType = "deutan" | "protan" | "tritan";

export const COLOR_TYPES: { value: ColorType; label: string; hint: string }[] = [
  { value: "deutan", label: "Дейтеранопия", hint: "Не различаю зелёный и красный (самый частый вид)" },
  { value: "protan", label: "Протанопия", hint: "Красный кажется тёмным и сливается с зелёным" },
  { value: "tritan", label: "Тританопия", hint: "Путаю синий с зелёным, жёлтый с розовым" },
];

export interface A11ySettings {
  lowVision: boolean;
  colorSafe: boolean;
  /** Действует, только когда включён colorSafe */
  colorType: ColorType;
  simple: boolean;
  speech: boolean;
  textSize: TextSize;
}

export const STORAGE_KEY = "a11y-settings";

export const DEFAULT_SETTINGS: A11ySettings = { lowVision: false, colorSafe: false, colorType: "deutan", simple: false, speech: false, textSize: 0 };

function read(): A11ySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<A11ySettings>;
    const size = Number(parsed.textSize);
    return {
      lowVision: parsed.lowVision === true,
      colorSafe: parsed.colorSafe === true,
      colorType: COLOR_TYPES.some((t) => t.value === parsed.colorType) ? (parsed.colorType as ColorType) : "deutan",
      simple: parsed.simple === true,
      speech: parsed.speech === true,
      textSize: size === 1 || size === 2 ? size : 0,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Повторяется во встроенном скрипте index.html: держать одинаковыми. */
export function applyToDocument(s: A11ySettings) {
  const root = document.documentElement;
  root.toggleAttribute("data-low-vision", s.lowVision);
  root.toggleAttribute("data-color-safe", s.colorSafe);
  if (s.colorSafe) root.setAttribute("data-color-type", s.colorType);
  else root.removeAttribute("data-color-type");
  root.toggleAttribute("data-simple", s.simple);
  root.setAttribute("data-text-size", String(s.textSize));
}

interface A11yContextValue {
  settings: A11ySettings;
  update: (patch: Partial<A11ySettings>) => void;
  reset: () => void;
  isCustomized: boolean;
}

const A11yContext = createContext<A11yContextValue | null>(null);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(read);

  useEffect(() => {
    applyToDocument(settings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Приватный режим или запрет хранилища: настройки работают до перезагрузки
    }
  }, [settings]);

  const update = useCallback((patch: Partial<A11ySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      // Режимы для слабовидящих и простой сразу делают текст крупнее; уменьшить можно вручную
      if ((patch.lowVision && !prev.lowVision) || (patch.simple && !prev.simple)) {
        next.textSize = Math.max(next.textSize, 1) as TextSize;
      }
      // Режим для слабовидящих сразу включает озвучку; выключить её можно отдельно
      if (patch.lowVision && !prev.lowVision && patch.speech === undefined) next.speech = true;
      return next;
    });
  }, []);

  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  useHoverSpeech(settings.speech);

  const value = useMemo(
    () => ({
      settings,
      update,
      reset,
      isCustomized: settings.lowVision || settings.colorSafe || settings.simple || settings.speech || settings.textSize > 0,
    }),
    [settings, update, reset],
  );

  return <A11yContext.Provider value={value}>{children}</A11yContext.Provider>;
}

export function useColorSafe(): ColorType | false {
  const { colorSafe, colorType } = useAccessibility().settings;
  return colorSafe ? colorType : false;
}

export function useAccessibility() {
  const ctx = useContext(A11yContext);
  if (!ctx) throw new Error("useAccessibility вне AccessibilityProvider");
  return ctx;
}
