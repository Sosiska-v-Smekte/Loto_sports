import { useAccessibility, type A11ySettings } from "@/features/accessibility";
import { cn } from "@/lib/cn";
import { Checkbox } from "./ui/Checkbox";

const OPTIONS: { key: "lowVision" | "colorSafe" | "simple"; label: string; hint: string }[] = [
  { key: "lowVision", label: "Для слабовидящих", hint: "Крупный контрастный текст, озвучка при наведении" },
  { key: "colorSafe", label: "Для людей с нарушением цветовосприятия", hint: "Другая палитра, статусы подписаны словами и рамкой" },
  { key: "simple", label: "Простой режим", hint: "Крупные кнопки, меньше лишнего, подсказки" },
];

/**
 * Выбор режимов доступности при регистрации. Режим включается сразу, как только вы отметили его: страница
 * меняется на глазах, и видно, подходит ли он. «Не нужно» — обычный вид. Позже всё можно поменять в шапке сайта.
 */
export function A11yChoice() {
  const { settings, update, reset } = useAccessibility();
  const any = settings.lowVision || settings.colorSafe || settings.simple;
  return (
    <fieldset className="flex flex-col gap-3 rounded-2xl border border-line bg-surface-muted p-4">
      <legend className="px-1 text-[15px] font-medium">Нужны ли вам специальные возможности?</legend>
      <label
        className={cn(
          "pressable flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium",
          !any ? "bg-primary-soft" : "hover:bg-white/60",
        )}
      >
        <input
          type="radio"
          name="a11y-choice"
          checked={!any}
          onChange={() => reset()}
          className="size-5 accent-[var(--color-primary)]"
        />
        Нет, обычный вид
      </label>
      <div className="flex flex-col gap-3 px-1">
        {OPTIONS.map((option) => (
          <Checkbox
            key={option.key}
            checked={settings[option.key]}
            onChange={(e) => update({ [option.key]: e.target.checked } as Partial<A11ySettings>)}
          >
            <span className="block font-medium">{option.label}</span>
            <span className="block text-sm text-muted">{option.hint}</span>
          </Checkbox>
        ))}
      </div>
      <p className="px-1 text-sm text-muted">Включается сразу. Изменить можно в любой момент кнопкой с глазом в шапке сайта.</p>
    </fieldset>
  );
}
