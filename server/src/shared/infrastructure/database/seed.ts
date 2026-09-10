import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import * as schema from './schema';

const adminEmail = process.env.SEED_ADMIN_EMAIL;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;
const BCRYPT_ROUNDS = 10;

if (!adminEmail || !adminPassword) {
  console.error(
    'ERROR: SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD env vars are required.',
  );
  process.exit(1);
}

if (process.env.NODE_ENV === 'production') {
  console.error('ERROR: Seeding is disabled in production environment.');
  process.exit(1);
}

const ADMIN_EMAIL: string = adminEmail;
const ADMIN_PASSWORD: string = adminPassword;

async function main(): Promise<void> {
  const pool = new Pool({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME ?? 'budget',
    user: process.env.DB_USER ?? 'budget_app',
    password: process.env.DB_PASSWORD ?? '',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
  });

  const db = drizzle(pool, { schema });

  // Check if admin already exists
  const existing = await db
    .select()
    .from(schema.users)
    .where((await import('drizzle-orm')).eq(schema.users.email, ADMIN_EMAIL));

  if (existing.length > 0) {
    console.log(`Admin user already exists: ${ADMIN_EMAIL}`);
    await pool.end();
    return;
  }

  const workspaceId = randomUUID();
  const userId = randomUUID();
  const permissionId = randomUUID();
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);
  const now = new Date();

  // Create workspace
  await db.insert(schema.workspaces).values({
    id: workspaceId,
    name: 'Admin Workspace',
    createdAt: now,
  });

  // Create admin user
  await db.insert(schema.users).values({
    id: userId,
    email: ADMIN_EMAIL,
    passwordHash,
    role: 'Superuser',
    workspaceId,
    createdAt: now,
    preferences: {
      currency: 'PLN',
      dateFormat: 'DD.MM.YYYY',
      language: 'pl',
      theme: 'dark',
      homePage: 'dashboard',
    },
  });

  // Create permission
  await db.insert(schema.permissions).values({
    id: permissionId,
    userId,
    resourceType: 'workspace',
    resourceId: workspaceId,
    actions: ['read', 'write', 'delete', 'admin'],
    createdAt: now,
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Admin user seeded successfully');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Email:     ${ADMIN_EMAIL}`);
  console.log(`  Role:      Superuser`);
  console.log(`  Workspace: ${workspaceId}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await pool.end();
}

main().catch((err: unknown) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
