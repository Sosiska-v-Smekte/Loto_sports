import { COLOR_TYPES, useAccessibility, type ColorType } from "@/features/accessibility";
import { cn } from "@/lib/cn";

const SWATCHES: Record<ColorType, { page: string; primary: string; ok: string; wait: string; bad: string }> = {
  deutan: { page: "#eaf0f9", primary: "#1d4e9e", ok: "#cfe0ff", wait: "#fff3b5", bad: "#ffa874" },
  protan: { page: "#f8f2d9", primary: "#2e3a96", ok: "#c9d7fb", wait: "#fff6b8", bad: "#ffa066" },
  tritan: { page: "#f7eef0", primary: "#8a1f3f", ok: "#bfe8c4", wait: "#fff4cc", bad: "#f5b4b8" },
};

function Swatch({ type }: { type: ColorType }) {
  const c = SWATCHES[type];
  const chip = "grid size-6 place-items-center rounded-full border border-black/15 text-[12px] font-bold leading-none text-ink";
  return (
    <span aria-hidden className="flex items-center gap-1.5 rounded-full border border-black/10 px-2 py-1" style={{ backgroundColor: c.page }}>
      <span className="size-6 rounded-full" style={{ backgroundColor: c.primary }} />
      <span className={chip} style={{ backgroundColor: c.ok }}>
        ✓
      </span>
      <span className={chip} style={{ backgroundColor: c.wait }}>
        ▲
      </span>
      <span className={chip} style={{ backgroundColor: c.bad }}>
        ✕
      </span>
    </span>
  );
}

export function ColorTypeChoice({ className }: { className?: string }) {
  const { settings, update } = useAccessibility();
  return (
    <fieldset className={cn("flex flex-col gap-2", className)}>
      <legend className="text-[15px] font-semibold">Какой у вас вид нарушения?</legend>
      {COLOR_TYPES.map((type) => {
        const active = settings.colorType === type.value;
        return (
          <label
            key={type.value}
            className={cn(
              "pressable flex cursor-pointer flex-col gap-2 rounded-2xl border-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3",
              "has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary",
              active ? "border-primary bg-primary-soft" : "border-line/70 bg-surface hover:bg-white/60",
            )}
          >
            <span className="flex min-w-0 items-start gap-3">
              <input
                type="radio"
                name="a11y-color-type"
                checked={active}
                onChange={() => update({ colorType: type.value })}
                className="mt-1 size-5 shrink-0 accent-[var(--color-primary)]"
              />
              <span className="min-w-0">
                <span className="block text-[16px] font-semibold leading-snug">{type.label}</span>
                <span className="block text-sm leading-snug text-muted">{type.hint}</span>
              </span>
            </span>
            <Swatch type={type.value} />
          </label>
        );
      })}
      <p className="text-sm text-muted">Не знаете свой вид? Выберите вариант, на котором статусы и кнопки читаются легче всего.</p>
    </fieldset>
  );
}
