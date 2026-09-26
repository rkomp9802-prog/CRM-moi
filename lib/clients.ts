import { execute, query, queryOne } from '@/lib/turso';
import type { Client } from '@/types/crm.types';

export interface ClientInput {
  name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
}

export async function listClients(search?: string): Promise<Client[]> {
  if (search && search.trim()) {
    const pattern = `%${search.trim()}%`;
    return query<Client>(
      `select * from clients
       where name like ? collate nocase or phone like ?
       order by created_at desc`,
      [pattern, pattern],
    );
  }
  return query<Client>('select * from clients order by created_at desc');
}

export function getClient(id: string): Promise<Client | null> {
  return queryOne<Client>('select * from clients where id = ?', [id]);
}

export async function createClient(input: ClientInput): Promise<Client> {
  const client: Client = {
    id: crypto.randomUUID(),
    name: input.name,
    phone: input.phone,
    email: input.email ?? null,
    notes: input.notes ?? null,
    created_at: new Date().toISOString(),
  };

  await execute(
    'insert into clients (id, name, phone, email, notes, created_at) values (?, ?, ?, ?, ?, ?)',
    [client.id, client.name, client.phone, client.email, client.notes, client.created_at],
  );

  return client;
}

export async function updateClient(id: string, input: Partial<ClientInput>): Promise<void> {
  const fields: string[] = [];
  const args: (string | null)[] = [];

  for (const key of ['name', 'phone', 'email', 'notes'] as const) {
    if (input[key] !== undefined) {
      fields.push(`${key} = ?`);
      args.push(input[key] ?? null);
    }
  }
  if (fields.length === 0) return;

  await execute(`update clients set ${fields.join(', ')} where id = ?`, [...args, id]);
}
