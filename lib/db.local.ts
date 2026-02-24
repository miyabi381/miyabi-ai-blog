import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";

type DbInstance = any;

let localDb: DbInstance | null = null;

function getLocalDbPath() {
  const fromEnv = process.env.LOCAL_DB_FILE?.trim();
  if (fromEnv) {
    return path.isAbsolute(fromEnv) ? fromEnv : path.resolve(process.cwd(), fromEnv);
  }
  return path.resolve(process.cwd(), ".local", "dev.sqlite");
}

function applyLocalMigrations(db: Database.Database) {
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

export function getLocalDb(schema: unknown): DbInstance {
  if (localDb) {
    return localDb;
  }

  const dbPath = getLocalDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  applyLocalMigrations(sqlite);

  localDb = drizzleSqlite(sqlite, { schema: schema as never });
  return localDb;
}
