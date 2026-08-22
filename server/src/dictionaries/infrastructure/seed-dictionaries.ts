/* eslint-disable no-console */
import 'dotenv/config';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/infrastructure/database/schema';
import { DictionaryType } from '@dictionaries/domain/dictionary-type.enum';
import { DictionaryEntry } from '@dictionaries/domain/dictionary-entry.entity';

const STUBS_DIR = resolve(__dirname, '../data/enriched');

interface StubMapping {
  readonly file: string;
  readonly type: DictionaryType;
}

const STUB_MAPPINGS: readonly StubMapping[] = [
  { file: 'first-names-pl.json', type: DictionaryType.FirstName },
  { file: 'first-names-en.json', type: DictionaryType.FirstName },
  { file: 'surnames-pl.json', type: DictionaryType.Surname },
  { file: 'merchants.json', type: DictionaryType.Merchant },
  { file: 'cities-pl.json', type: DictionaryType.City },
  { file: 'phrases.json', type: DictionaryType.Phrase },
];

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    console.error(
      'ERROR: Dictionary seeding is disabled in production environment.',
    );
    process.exit(1);
  }

  const pool = new Pool({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME ?? 'budget',
    user: process.env.DB_USER ?? 'budget_app',
    password: process.env.DB_PASSWORD ?? '',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
  });

  try {
    const db = drizzle(pool, { schema });

    let totalInserted = 0;
    let totalSkipped = 0;

    for (const mapping of STUB_MAPPINGS) {
      const filePath = resolve(STUBS_DIR, mapping.file);
      let values: string[];

      try {
        const raw = readFileSync(filePath, 'utf-8');
        values = JSON.parse(raw) as string[];
      } catch {
        console.warn(`WARN: Could not read ${mapping.file}, skipping.`);
        continue;
      }

      const rows = values.map((value) => {
        const entry = DictionaryEntry.create({ type: mapping.type, value });
        return {
          id: entry.id,
          type: entry.type,
          value: entry.value,
          createdAt: entry.createdAt,
        };
      });

      if (rows.length === 0) continue;

      const result = await db
        .insert(schema.dictionaries)
        .values(rows)
        .onConflictDoNothing();

      const inserted = result.rowCount ?? 0;
      const skipped = rows.length - inserted;

      totalInserted += inserted;
      totalSkipped += skipped;

      console.log(
        `[${mapping.type}] ${mapping.file}: ${String(inserted)} inserted, ${String(skipped)} skipped`,
      );
    }

    console.log(
      `\nDone. Total inserted: ${String(totalInserted)}, skipped: ${String(totalSkipped)}`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((err: unknown) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
