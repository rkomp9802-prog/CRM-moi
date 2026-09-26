import { execute, query, queryOne } from '@/lib/turso';
import { badRequest, notFound } from '@/lib/api';
import { hashPassword, verifyPassword } from '@/lib/auth';
import type { User, UserRole } from '@/types/crm.types';

interface UserRow extends Omit<User, 'is_active'> {
  is_active: number;
}

const toUser = (row: UserRow): User => ({ ...row, is_active: row.is_active === 1 });

const SELECT = 'select id, name, email, role, created_at, is_active, avatar_url from users';

export async function listUsers(): Promise<User[]> {
  const rows = await query<UserRow>(`${SELECT} order by is_active desc, name collate nocase`);
  return rows.map(toUser);
}

/** Активные сотрудники — для выпадающих списков «назначить на». */
export async function listActiveUsers(): Promise<User[]> {
  const rows = await query<UserRow>(`${SELECT} where is_active = 1 order by name collate nocase`);
  return rows.map(toUser);
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  if (input.password.length < 8) throw badRequest('Пароль должен быть не короче 8 символов');

  const existing = await queryOne<{ id: string }>('select id from users where email = ?', [
    input.email,
  ]);
  if (existing) throw badRequest('Пользователь с такой почтой уже существует');

  const user: User = {
    id: crypto.randomUUID(),
    name: input.name,
    email: input.email,
    role: input.role,
    created_at: new Date().toISOString(),
    is_active: true,
    avatar_url: null,
  };

  await execute(
    `insert into users (id, name, email, password_hash, role, is_active, created_at)
     values (?, ?, ?, ?, ?, 1, ?)`,
    [user.id, user.name, user.email, await hashPassword(input.password), user.role, user.created_at],
  );

  return user;
}

export interface UserPatch {
  role?: UserRole;
  is_active?: boolean;
  name?: string;
  password?: string;
}

export async function updateUser(id: string, patch: UserPatch, actorId: string): Promise<User> {
  const target = await queryOne<UserRow>(`${SELECT} where id = ?`, [id]);
  if (!target) throw notFound('Пользователь');

  // Защита от ситуации, когда админ отключает сам себя и систему некому администрировать.
  if (id === actorId) {
    if (patch.is_active === false) throw badRequest('Нельзя деактивировать самого себя');
    if (patch.role && patch.role !== 'admin') {
      throw badRequest('Нельзя снять с себя роль администратора');
    }
  }

  const fields: string[] = [];
  const args: (string | number)[] = [];

  if (patch.name !== undefined) {
    fields.push('name = ?');
    args.push(patch.name);
  }
  if (patch.role !== undefined) {
    fields.push('role = ?');
    args.push(patch.role);
  }
  if (patch.is_active !== undefined) {
    fields.push('is_active = ?');
    args.push(patch.is_active ? 1 : 0);
  }
  if (patch.password !== undefined) {
    if (patch.password.length < 8) throw badRequest('Пароль должен быть не короче 8 символов');
    fields.push('password_hash = ?');
    args.push(await hashPassword(patch.password));
  }
  if (fields.length === 0) throw badRequest('Нечего обновлять');

  await execute(`update users set ${fields.join(', ')} where id = ?`, [...args, id]);
  return toUser((await queryOne<UserRow>(`${SELECT} where id = ?`, [id]))!);
}

export interface ProfilePatch {
  name?: string;
  email?: string;
  /** undefined — не трогать, null — убрать аватар. */
  avatar_url?: string | null;
  currentPassword?: string;
  newPassword?: string;
}

/**
 * Изменение собственного профиля. В отличие от updateUser здесь нельзя менять роль
 * и активность — это остаётся за админом на странице сотрудников.
 */
export async function updateOwnProfile(userId: string, patch: ProfilePatch): Promise<User> {
  const current = await queryOne<UserRow & { password_hash: string }>(
    `select id, name, email, role, created_at, is_active, avatar_url, password_hash
     from users where id = ?`,
    [userId],
  );
  if (!current) throw notFound('Пользователь');

  const fields: string[] = [];
  const args: (string | null)[] = [];

  if (patch.name !== undefined) {
    fields.push('name = ?');
    args.push(patch.name);
  }

  if (patch.email !== undefined && patch.email !== current.email) {
    const taken = await queryOne<{ id: string }>('select id from users where email = ?', [
      patch.email,
    ]);
    if (taken) throw badRequest('Пользователь с такой почтой уже существует');
    fields.push('email = ?');
    args.push(patch.email);
  }

  if (patch.avatar_url !== undefined) {
    fields.push('avatar_url = ?');
    args.push(patch.avatar_url);
  }

  if (patch.newPassword !== undefined) {
    if (patch.newPassword.length < 8) throw badRequest('Пароль должен быть не короче 8 символов');
    // Текущий пароль обязателен: иначе чужая открытая вкладка позволяла бы сменить пароль.
    if (!patch.currentPassword) throw badRequest('Введите текущий пароль');

    const ok = await verifyPassword(patch.currentPassword, current.password_hash);
    if (!ok) throw badRequest('Текущий пароль указан неверно');

    fields.push('password_hash = ?');
    args.push(await hashPassword(patch.newPassword));
  }

  if (fields.length === 0) throw badRequest('Нечего обновлять');

  await execute(`update users set ${fields.join(', ')} where id = ?`, [...args, userId]);
  return toUser((await queryOne<UserRow>(`${SELECT} where id = ?`, [userId]))!);
}
