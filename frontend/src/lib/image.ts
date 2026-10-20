const SIZE = 256;

/**
 * Готовит фото для аватарки: вырезает центральный квадрат, сжимает до 256×256 и возвращает JPEG в виде
 * строки data:image/jpeg;base64. Так на сервер уходит десяток килобайт, а не снимок с телефона на несколько мегабайт.
 */
export async function imageToAvatar(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Выберите файл с картинкой: JPEG, PNG или WebP");
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("Не удалось открыть картинку. Попробуйте другой файл");
  });
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Браузер не смог обработать картинку");
  // Белая подложка: у прозрачного PNG после перевода в JPEG иначе был бы чёрный фон
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.88);
}
