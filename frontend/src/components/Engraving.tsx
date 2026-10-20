import { findPattern } from "@/lib/engraving";

/** Родителю нужны relative и isolate: слой лежит под содержимым. */
export function Engraving({ pattern }: { pattern: string | null | undefined }) {
  const info = findPattern(pattern);
  if (!info) return null;
  return (
    <span
      aria-hidden
      className="engraving pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-black/[0.08]"
      style={{
        maskImage: `url(${info.src})`,
        WebkitMaskImage: `url(${info.src})`,
        maskSize: info.size,
        WebkitMaskSize: info.size,
        maskRepeat: info.repeat,
        WebkitMaskRepeat: info.repeat,
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
    />
  );
}
