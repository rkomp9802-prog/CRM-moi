/**
 * Создаёт первого администратора из переменных окружения.
 * Через UI это сделать нельзя специально — иначе любой мог бы назначить себя админом.
 * Запуск: npm run db:seed
 */
import { db } from '../lib/turso';
import { hashPassword } from '../lib/auth';

async function main() {
  const name = process.env.SEED_ADMIN_NAME?.trim() || 'Администратор';
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Задайте SEED_ADMIN_EMAIL и SEED_ADMIN_PASSWORD в .env.local');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('SEED_ADMIN_PASSWORD должен быть не короче 8 символов');
    process.exit(1);
  }

  const existing = await db.execute({
    sql: 'select id from users where email = ?',
    args: [email],
  });
  if (existing.rows.length > 0) {
    console.log(`Пользователь ${email} уже существует — ничего не меняю.`);
    return;
  }

  await db.execute({
    sql: `insert into users (id, name, email, password_hash, role, is_active, created_at)
          values (?, ?, ?, ?, 'admin', 1, ?)`,
    args: [
      crypto.randomUUID(),
      name,
      email,
      await hashPassword(password),
      new Date().toISOString(),
    ],
  });
  console.log(`Администратор создан: ${email}`);
}

main().catch((error) => {
  console.error('Не удалось создать администратора:', error);
  process.exit(1);
});
