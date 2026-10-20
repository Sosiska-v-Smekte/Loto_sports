import { Camera, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { errorMessage } from "@/api/client";
import { imageToAvatar } from "@/lib/image";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";

interface AvatarUploaderProps {
  name: string;
  id: number;
  src: string | null | undefined;
  /** Получает готовую квадратную картинку (data URL) и сохраняет её */
  onUpload: (image: string) => Promise<unknown>;
  onRemove: () => Promise<unknown>;
}

/** Аватарка с кнопками «Загрузить фото» и «Убрать». Фото обрезается по центру до квадрата и сжимается в браузере. */
export function AvatarUploader({ name, id, src, onUpload, onRemove }: AvatarUploaderProps) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <Avatar name={name} id={id} src={src} size="xl" />
      <div className="flex flex-col items-center gap-2 sm:items-start">
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="secondary" size="sm" loading={busy} icon={<Camera className="size-4" aria-hidden />} onClick={() => input.current?.click()}>
            {src ? "Заменить фото" : "Загрузить фото"}
          </Button>
          {src && (
            <Button variant="ghost" size="sm" disabled={busy} icon={<Trash2 className="size-4" aria-hidden />} onClick={() => run(onRemove)}>
              Убрать
            </Button>
          )}
        </div>
        <p className="text-sm text-muted">JPEG, PNG или WebP. Фото обрежется до квадрата.</p>
        {error && (
          <p role="alert" className="text-sm font-medium text-danger-ink">
            {error}
          </p>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label="Выбрать фото"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void run(async () => onUpload(await imageToAvatar(file)));
        }}
      />
    </div>
  );
}
