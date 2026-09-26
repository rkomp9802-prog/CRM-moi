/**
 * Уменьшение картинки в браузере перед отправкой.
 * Аватар хранится строкой прямо в базе, поэтому на сервер должен уезжать не
 * исходный файл на несколько мегабайт, а квадрат 256×256 весом десятки килобайт.
 */
const AVATAR_SIZE = 256;
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

export async function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Это не картинка');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('Файл больше 15 МБ');
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('Не удалось открыть картинку — попробуйте PNG или JPEG');
  }

  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;

  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    throw new Error('Браузер не смог обработать картинку');
  }

  // Обрезаем по центру до квадрата, чтобы аватар не сплющивался.
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  context.drawImage(bitmap, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  bitmap.close();

  // Если браузер не умеет webp, toDataURL молча отдаёт png — оба формата сервер принимает.
  return canvas.toDataURL('image/webp', 0.85);
}
