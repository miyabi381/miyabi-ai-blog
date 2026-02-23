import { jwtVerify, SignJWT } from "jose";

export type SessionPayload = {
  userId: number;
  username: string;
  email: string;
};

const TOKEN_AGE_SECONDS = 60 * 60 * 24 * 7;

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }
  return new TextEncoder().encode(secret);
}

export async function createToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: ["HS256"]
  });
  return payload as SessionPayload;
}

export const AUTH_COOKIE_NAME = "miyabi_auth_token";
export const AUTH_COOKIE_MAX_AGE = TOKEN_AGE_SECONDS;

