/**
 * Простое ограничение частоты запросов в памяти процесса.
 * Публичный эндпоинт приёма заявок иначе открыт для спама: ключ доступа защищает
 * от чужих, но не от того, кто этот ключ уже видел в коде сайта.
 *
 * Важно: счётчик живёт в памяти. На Vercel инстансов может быть несколько, и каждый
 * считает своё — это защита от грубого потока, а не строгая квота.
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);

  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }

  recent.push(now);
  hits.set(key, recent);

  // Чтобы карта не росла бесконечно от разовых посетителей.
  if (hits.size > 5000) {
    for (const [existingKey, times] of hits) {
      if (times.every((time) => now - time >= windowMs)) hits.delete(existingKey);
    }
  }

  return true;
}
