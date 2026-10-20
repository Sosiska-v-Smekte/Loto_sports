import { useEffect } from "react";

const READABLE = [
  "a[href]",
  "button",
  "[role='button']",
  "[role='switch']",
  "[role='tab']",
  "[role='menuitem']",
  "input",
  "select",
  "textarea",
  "label",
  "h1",
  "h2",
  "h3",
  "p",
  "li",
  "dt",
  "dd",
  "img[alt]",
].join(",");

export const speechSupported = () => typeof window !== "undefined" && "speechSynthesis" in window;

const clean = (text: string | null | undefined) => (text ?? "").replace(/\s+/g, " ").trim();

function labelOf(el: HTMLElement): string {
  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    const text = labelledBy
      .split(" ")
      .map((id) => document.getElementById(id)?.innerText)
      .join(" ");
    if (clean(text)) return clean(text);
  }
  const aria = el.getAttribute("aria-label");
  if (aria) return clean(aria);
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
    const label = el.labels?.[0]?.innerText;
    const value = el instanceof HTMLSelectElement ? el.selectedOptions[0]?.text : el.value;
    const hint = "placeholder" in el ? el.placeholder : "";
    return clean([label, value ? `введено: ${value}` : hint].filter(Boolean).join(". "));
  }
  if (el instanceof HTMLImageElement) return clean(el.alt);
  return clean(el.innerText);
}

function roleOf(el: HTMLElement): string {
  const role = el.getAttribute("role");
  if (role === "switch") return el.getAttribute("aria-checked") === "true" ? "Переключатель, включён" : "Переключатель, выключен";
  if (role === "tab") return el.getAttribute("aria-selected") === "true" ? "Вкладка, выбрана" : "Вкладка";
  if (el.tagName === "A") return "Ссылка";
  if (el.tagName === "BUTTON" || role === "button" || role === "menuitem") {
    const pressed = el.getAttribute("aria-pressed");
    return pressed === "true" ? "Кнопка, выбрана" : "Кнопка";
  }
  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return "Поле ввода";
  if (el.tagName === "SELECT") return "Список";
  if (/^H[1-3]$/.test(el.tagName)) return "Заголовок";
  return "";
}

function describe(target: Element): { el: HTMLElement; text: string } | null {
  const card = target.closest<HTMLElement>("article");
  if (card?.querySelector("a[href]")) return { el: card, text: `Карточка. ${clean(card.innerText)}` };
  const el = target.closest<HTMLElement>(READABLE);
  if (!el || el.closest("[aria-hidden='true']")) return null;
  const text = labelOf(el);
  if (!text) return null;
  const role = roleOf(el);
  return { el, text: role ? `${role}. ${text}` : text };
}

let ruVoice: SpeechSynthesisVoice | null | undefined;
function pickVoice() {
  if (ruVoice) return ruVoice;
  const voices = window.speechSynthesis.getVoices();
  ruVoice = voices.find((v) => v.lang.toLowerCase().startsWith("ru")) ?? null;
  return ruVoice;
}

export function speak(text: string) {
  if (!speechSupported()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text.slice(0, 400));
  utterance.lang = "ru-RU";
  const voice = pickVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = 0.95;
  synth.speak(utterance);
}

export function useHoverSpeech(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !speechSupported()) return;
    let current: HTMLElement | null = null;
    let timer = 0;

    const mark = (el: HTMLElement | null) => {
      current?.removeAttribute("data-speaking");
      current = el;
      el?.setAttribute("data-speaking", "");
    };

    const announce = (target: EventTarget | null, delay: number) => {
      if (!(target instanceof Element)) return;
      const found = describe(target);
      if (!found || found.el === current) return;
      window.clearTimeout(timer);
      // Небольшая пауза: при быстром движении мыши не читаем всё подряд
      timer = window.setTimeout(() => {
        mark(found.el);
        speak(found.text);
      }, delay);
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType === "mouse") announce(e.target, 280);
    };
    const onFocus = (e: FocusEvent) => announce(e.target, 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        window.speechSynthesis.cancel();
        mark(null);
      }
    };
    const onLeave = () => {
      window.clearTimeout(timer);
      mark(null);
    };

    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener?.("voiceschanged", pickVoice);
    document.addEventListener("pointerover", onOver);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("keydown", onKey);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.clearTimeout(timer);
      window.speechSynthesis.cancel();
      window.speechSynthesis.removeEventListener?.("voiceschanged", pickVoice);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("keydown", onKey);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      mark(null);
    };
  }, [enabled]);
}
