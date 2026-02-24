import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import * as schema from "@/db/schema";

type CloudflareEnv = {
  DB: D1Database;
};

type LocalSqlite = Database.Database;
type DbInstance = any;

let localDb: DbInstance | null = null;

function getCloudflareDb(): DbInstance | null {
  try {
    const context = getRequestContext();
    const env = context?.env as CloudflareEnv | undefined;
    if (!env?.DB) {
      return null;
    }
    return drizzleD1(env.DB, { schema });
  } catch {
    return null;
  }
}

function getLocalDbPath() {
  const fromEnv = process.env.LOCAL_DB_FILE?.trim();
  if (fromEnv) {
    return path.isAbsolute(fromEnv) ? fromEnv : path.resolve(process.cwd(), fromEnv);
  }
  return path.resolve(process.cwd(), ".local", "dev.sqlite");
}

function applyLocalMigrations(db: LocalSqlite) {
  const migrationsDir = path.resolve(process.cwd(), "migrations");
  if (!fs.existsSync(migrationsDir)) {
    return;
  }

  db.exec(
    "CREATE TABLE IF NOT EXISTS __local_migrations (id TEXT PRIMARY KEY, applied_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL);"
  );

  const files = fs
    .readdirSync(migrationsDir)
    .filter((name) => name.toLowerCase().endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    const alreadyApplied = db.prepare("SELECT id FROM __local_migrations WHERE id = ? LIMIT 1").get(file);
    if (alreadyApplied) {
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    db.exec(sql);
    db.prepare("INSERT INTO __local_migrations (id) VALUES (?)").run(file);
  }
}

function getLocalDb(): DbInstance {
  if (localDb) {
    return localDb;
  }

  const dbPath = getLocalDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  applyLocalMigrations(sqlite);

  localDb = drizzleSqlite(sqlite, { schema });
  return localDb;
}

export function getDb() {
  const cfDb = getCloudflareDb();
  if (cfDb) {
    return cfDb;
  }

  if (process.env.NODE_ENV !== "production") {
    return getLocalDb();
  }

  throw new Error("D1 binding `DB` is not available.");
}
