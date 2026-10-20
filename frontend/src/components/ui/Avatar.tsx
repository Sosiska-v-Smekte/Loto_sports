import { cn } from "@/lib/cn";
import { initials } from "@/lib/names";

const BACKGROUNDS = ["#F6D46A", "#F2A9C8", "#AFC3EE", "#C3D69A", "#F5BE92", "#CDB8EE", "#A9D8C6", "#E9CF9F"];

interface AvatarProps {
  name: string;
  id: number;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZES = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-16 text-xl", xl: "size-24 text-3xl" };

export function Avatar({ name, id, src, size = "sm", className }: AvatarProps) {
  const classes = cn("shrink-0 rounded-full shadow-soft ring-2 ring-white", SIZES[size], className);
  if (src) return <img src={src} alt="" className={cn(classes, "object-cover")} />;
  return (
    <span
      aria-hidden
      className={cn(classes, "grid place-items-center font-semibold text-ink")}
      style={{ backgroundColor: BACKGROUNDS[id % BACKGROUNDS.length] }}
    >
      {initials(name)}
    </span>
  );
}
