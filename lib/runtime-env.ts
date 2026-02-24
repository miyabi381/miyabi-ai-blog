import { getRequestContext } from "@cloudflare/next-on-pages";

type RuntimeEnv = {
  JWT_SECRET?: string;
};

function getCloudflareEnvValue(key: keyof RuntimeEnv): string | undefined {
  try {
    const env = getRequestContext()?.env as RuntimeEnv | undefined;
    const value = env?.[key];
    return typeof value === "string" && value.length > 0 ? value : undefined;
  } catch {
    return undefined;
  }
}

export function getRuntimeEnv(key: keyof RuntimeEnv): string | undefined {
  return getCloudflareEnvValue(key) ?? process.env[key];
}
