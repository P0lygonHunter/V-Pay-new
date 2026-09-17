import { SignJWT, jwtVerify } from "jose";

function requireSecret(name: string): Uint8Array {
  const value = process.env[name];
  if (!value || value.length < 32) {
    // Fail loudly at first use rather than silently falling back to a
    // guessable default — a wrong secret is a bug you want to see in
    // logs immediately, not a security hole you find out about later.
    throw new Error(
      `${name} is not set (or shorter than 32 chars). Set it in Vercel -> Project -> Settings -> Environment Variables.`
    );
  }
  return new TextEncoder().encode(value);
}

function accessSecret() {
  return requireSecret("JWT_ACCESS_SECRET");
}
function refreshSecret() {
  return requireSecret("JWT_REFRESH_SECRET");
}

export async function signAccessToken(payload: { sub: string; phone: string }) {
  return new SignJWT({ ...payload, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_ACCESS_EXPIRES || "15m")
    .sign(accessSecret());
}

export async function signRefreshToken(payload: { sub: string; phone: string }) {
  return new SignJWT({ ...payload, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_REFRESH_EXPIRES || "7d")
    .sign(refreshSecret());
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, accessSecret());
  if (payload.type !== "access") throw new Error("Invalid token type");
  return payload as { sub: string; phone: string; type: string };
}

export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(token, refreshSecret());
  if (payload.type !== "refresh") throw new Error("Invalid token type");
  return payload as { sub: string; phone: string; type: string };
}

export async function createTokens(userId: string, phone: string) {
  const base = { sub: userId, phone };
  const accessToken = await signAccessToken(base);
  const refreshToken = await signRefreshToken(base);
  return { accessToken, refreshToken, expiresIn: 15 * 60 };
}
