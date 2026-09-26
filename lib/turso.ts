import { createClient, type Client, type InValue } from '@libsql/client';

declare global {

  var __crmDbClient: Client | undefined;
}

function create(): Client {
  const url = process.env.TURSO_DATABASE_URL ?? 'file:local.db';
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined;
  return createClient({ url, authToken });
}

// В dev Next перезагружает модули на каждое изменение — без глобального кэша
// на каждой перезагрузке открывалось бы новое соединение с базой.
export const db: Client = globalThis.__crmDbClient ?? create();
if (process.env.NODE_ENV !== 'production') globalThis.__crmDbClient = db;

/**
 * Выполнить запрос и получить строки уже приведёнными к нужному типу.
 * Строки libSQL — объекты со своим прототипом; их нельзя передавать из серверных
 * компонентов в клиентские, поэтому каждую строку пересобираем в обычный объект.
 */
export async function query<T>(sql: string, args: InValue[] = []): Promise<T[]> {
  const result = await db.execute({ sql, args });
  return result.rows.map((row) => {
    const plain: Record<string, unknown> = {};
    for (const column of result.columns) {
      plain[column] = row[column as keyof typeof row];
    }
    return plain as T;
  });
}

/** Первая строка результата или null. */
export async function queryOne<T>(sql: string, args: InValue[] = []): Promise<T | null> {
  const rows = await query<T>(sql, args);
  return rows[0] ?? null;
}

export async function execute(sql: string, args: InValue[] = []): Promise<void> {
  await db.execute({ sql, args });
}
