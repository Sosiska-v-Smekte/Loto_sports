import { Contrast, Eye, Hand, RotateCcw, Volume2, type LucideIcon } from "lucide-react";
import { Fragment, useState } from "react";
import { useAccessibility, type A11ySettings, type TextSize } from "@/features/accessibility";
import { speak, speechSupported } from "@/features/speech";
import { cn } from "@/lib/cn";
import { Button } from "./ui/Button";
import { ColorTypeChoice } from "./ColorTypeChoice";
import { Modal } from "./ui/Modal";

interface ModeInfo {
  key: "lowVision" | "colorSafe" | "simple" | "speech";
  title: string;
  text: string;
  icon: LucideIcon;
}

const MODES: ModeInfo[] = [
  {
    key: "lowVision",
    title: "Для слабовидящих",
    text: "Крупный и контрастный текст, чёткие рамки, яркая подсветка выбранного элемента, без фонового узора. Сразу включает озвучку.",
    icon: Eye,
  },
  {
    key: "speech",
    title: "Озвучка при наведении",
    text: "Наведите мышь или перейдите клавишей Tab — сайт прочитает вслух кнопку, ссылку или карточку события. Esc — замолчать.",
    icon: Volume2,
  },
  {
    key: "colorSafe",
    title: "Для людей с нарушением цветовосприятия",
    text: "Своя палитра для дейтеранопии, протанопии и тританопии: перекрашиваются страница, кнопки, статусы и карточки. Статусы отличаются ещё рамкой и значком (✓ ▲ ✕), выходные дни — чертой.",
    icon: Contrast,
  },
  {
    key: "simple",
    title: "Простой режим",
    text: "Крупные кнопки, меньше лишнего на экране, подсказки «что делать дальше», простой выбор даты, без анимаций.",
    icon: Hand,
  },
];

const TEXT_SIZES: { value: TextSize; label: string; sample: string }[] = [
  { value: 0, label: "Обычный", sample: "text-[17px]" },
  { value: 1, label: "Крупный", sample: "text-[21px]" },
  { value: 2, label: "Очень крупный", sample: "text-[25px]" },
];

function ModeSwitch({ mode, checked, onChange }: { mode: ModeInfo; checked: boolean; onChange: (v: boolean) => void }) {
  const Icon = mode.icon;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        // Сетка: значок, название и тумблер в одной строке, описание под ними во всю ширину на телефоне
        "pressable grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-[20px] border-2 p-4 text-left",
        checked ? "border-primary bg-primary-soft" : "neu-raised-sm border-line/70",
      )}
    >
      <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", checked ? "neu-primary bg-primary text-white" : "bg-primary-soft text-primary")}>
        <Icon className="size-6" aria-hidden />
      </span>
      <span className="hyphens-auto text-[17px] font-semibold leading-snug [overflow-wrap:anywhere]">{mode.title}</span>
      {/* Тумблер: положение и подпись дублируют цвет */}
      <span
        aria-hidden
        className={cn(
          "neu-inset relative flex h-8 w-[70px] shrink-0 items-center rounded-full px-1 text-[11px] font-bold transition-colors",
          checked ? "bg-primary text-white" : "bg-line text-ink",
        )}
      >
        <span className={cn("absolute", checked ? "left-2.5" : "right-2")}>{checked ? "ВКЛ" : "ВЫКЛ"}</span>
        <span
          className={cn(
            "neu-raised-sm relative z-[1] size-6 rounded-full bg-surface transition-transform duration-200",
            checked && "translate-x-[38px]",
          )}
        />
      </span>
      <span className="col-span-3 text-[15px] leading-snug text-muted sm:col-span-1 sm:col-start-2">{mode.text}</span>
    </button>
  );
}

export function AccessibilityPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, update, reset, isCustomized } = useAccessibility();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Специальные возможности"
      description="Включите то, что удобно. Настройки запоминаются на этом устройстве."
      footer={
        <>
          <Button variant="secondary" onClick={reset} disabled={!isCustomized} icon={<RotateCcw className="size-5" aria-hidden />}>
            Сбросить
          </Button>
          <Button onClick={onClose}>Готово</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {MODES.filter((mode) => mode.key !== "speech" || speechSupported()).map((mode) => (
          <Fragment key={mode.key}>
            <ModeSwitch
              mode={mode}
              checked={settings[mode.key]}
              onChange={(value) => {
                update({ [mode.key]: value } as Partial<A11ySettings>);
                if (value && (mode.key === "speech" || mode.key === "lowVision")) {
                  speak("Озвучка включена. Наведите мышь на элемент, чтобы услышать его.");
                }
              }}
            />
            {mode.key === "colorSafe" && settings.colorSafe && <ColorTypeChoice className="rounded-[20px] bg-surface-muted p-4" />}
          </Fragment>
        ))}
      </div>
      <fieldset className="mt-5">
        <legend className="text-[17px] font-semibold">Размер текста и кнопок</legend>
        <div className="neu-inset mt-2 grid grid-cols-3 gap-1.5 rounded-[20px] bg-surface-muted p-1.5">
          {TEXT_SIZES.map((size) => {
            const active = settings.textSize === size.value;
            return (
              <label
                key={size.value}
                className={cn(
                  "pressable flex min-h-16 cursor-pointer flex-col items-center justify-center rounded-2xl px-2 py-2 text-center has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary",
                  active ? "neu-primary bg-primary text-white" : "hover:bg-white/60",
                )}
              >
                <input
                  type="radio"
                  name="a11y-text-size"
                  className="sr-only"
                  checked={active}
                  onChange={() => update({ textSize: size.value })}
                />
                <span aria-hidden className={cn("font-semibold leading-none", size.sample)}>
                  Аа
                </span>
                <span className="mt-1 text-[13px] font-medium leading-tight">{size.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </Modal>
  );
}

/** Кнопка в шапке. На телефоне — только значок, на широком экране с подписью. */
export function AccessibilityButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { isCustomized } = useAccessibility();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label="Специальные возможности: для слабовидящих, дальтоников, простой режим"
        className={cn(
          "neu-control pressable relative inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-line/70 bg-surface-muted px-2.5 font-medium xl:min-h-[50px] xl:px-4",
          className,
        )}
      >
        <Eye className="size-[22px]" aria-hidden />
        <span className="hidden text-[15px] huge:inline">Доступность</span>
        {isCustomized && (
          <span aria-hidden className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-primary ring-2 ring-[#f7f2e8]" />
        )}
      </button>
      <AccessibilityPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
