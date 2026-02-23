import { drizzle } from "drizzle-orm/d1";
import { getRequestContext } from "@cloudflare/next-on-pages";
import * as schema from "@/db/schema";

type CloudflareEnv = {
  DB: D1Database;
};

export function getDb() {
  const context = getRequestContext();
  const env = context?.env as CloudflareEnv | undefined;
  if (!env?.DB) {
    throw new Error("D1 binding `DB` is not available.");
  }
  return drizzle(env.DB, { schema });
}

