import { getRequestContext } from "@cloudflare/next-on-pages";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import * as schema from "@/db/schema";

type CloudflareEnv = {
  DB: D1Database;
};

type DbInstance = any;

let localDbPromise: Promise<DbInstance> | null = null;

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

async function getLocalDb(): Promise<DbInstance> {
  if (localDbPromise) {
    return localDbPromise;
  }

  // Prevent edge/worker bundlers from statically resolving native sqlite modules.
  const dynamicImport = new Function("p", "return import(p)") as (path: string) => Promise<any>;
  localDbPromise = dynamicImport("./db.local").then((mod) => mod.getLocalDb(schema));
  return localDbPromise;
}

export async function getDb() {
  const cfDb = getCloudflareDb();
  if (cfDb) {
    return cfDb;
  }

  if (process.env.NODE_ENV !== "production") {
    return getLocalDb();
  }

  throw new Error("D1 binding `DB` is not available.");
}
