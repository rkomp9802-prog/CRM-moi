/**
 * Идемпотентные миграции: можно запускать сколько угодно раз.
 * Запуск: npm run db:migrate
 */
import { db } from '../lib/turso';

const statements = [
  `create table if not exists users (
    id text primary key,
    name text not null,
    email text not null unique,
    password_hash text not null,
    role text not null default 'manager',
    is_active integer not null default 1,
    created_at text not null
  )`,
  `create table if not exists clients (
    id text primary key,
    name text not null,
    phone text not null,
    email text,
    notes text,
    created_at text not null
  )`,
  `create table if not exists leads (
    id text primary key,
    client_id text not null references clients(id),
    source text not null default 'manual',
    status text not null default 'new',
    assigned_to text references users(id),
    value real,
    notes text,
    created_at text not null,
    updated_at text not null
  )`,
  `create table if not exists tasks (
    id text primary key,
    lead_id text references leads(id),
    client_id text references clients(id),
    assigned_to text not null references users(id),
    title text not null,
    due_date text,
    status text not null default 'pending',
    created_at text not null
  )`,
  // Индексы под запросы, которые выполняются на каждой странице:
  // фильтр заявок по исполнителю (скоуп менеджера) и список заявок клиента.
  'create index if not exists idx_leads_assigned_to on leads(assigned_to)',
  'create index if not exists idx_leads_client_id on leads(client_id)',
  'create index if not exists idx_leads_status on leads(status)',
  'create index if not exists idx_tasks_assigned_to on tasks(assigned_to)',
  'create index if not exists idx_tasks_due_date on tasks(due_date)',
  'create index if not exists idx_tasks_lead_id on tasks(lead_id)',
];

/** Колонки, добавленные к уже существующим таблицам. */
const addedColumns: [table: string, column: string, definition: string][] = [
  // Аватар: либо ссылка http(s), либо data:image/... с картинкой, уменьшенной в браузере.
  ['users', 'avatar_url', 'text'],
];

async function addColumnIfMissing(table: string, column: string, definition: string) {
  const info = await db.execute(`pragma table_info(${table})`);
  const exists = info.rows.some((row) => row.name === column);
  if (exists) return false;

  await db.execute(`alter table ${table} add column ${column} ${definition}`);
  return true;
}

async function main() {
  for (const sql of statements) {
    await db.execute(sql);
  }

  let added = 0;
  for (const [table, column, definition] of addedColumns) {
    if (await addColumnIfMissing(table, column, definition)) {
      console.log(`Добавлена колонка ${table}.${column}`);
      added += 1;
    }
  }

  console.log(`Миграции применены (${statements.length} шт., новых колонок: ${added})`);
  console.log(`База: ${process.env.TURSO_DATABASE_URL ?? 'file:local.db'}`);
}

main().catch((error) => {
  console.error('Миграции не применились:', error);
  process.exit(1);
});
