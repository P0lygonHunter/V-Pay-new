import { SignJWT, jwtVerify } from "jose";

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET || "vortex-dev-access-secret-change-me-32chars-min"
);
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || "vortex-dev-refresh-secret-change-me-32chars-min"
);

export async function signAccessToken(payload: { sub: string; phone: string }) {
  return new SignJWT({ ...payload, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_ACCESS_EXPIRES || "15m")
    .sign(ACCESS_SECRET);
}

export async function signRefreshToken(payload: { sub: string; phone: string }) {
  return new SignJWT({ ...payload, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_REFRESH_EXPIRES || "7d")
    .sign(REFRESH_SECRET);
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, ACCESS_SECRET);
  if (payload.type !== "access") throw new Error("Invalid token type");
  return payload as { sub: string; phone: string; type: string };
}

export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(token, REFRESH_SECRET);
  if (payload.type !== "refresh") throw new Error("Invalid token type");
  return payload as { sub: string; phone: string; type: string };
}

export async function createTokens(userId: string, phone: string) {
  const base = { sub: userId, phone };
  const accessToken = await signAccessToken(base);
  const refreshToken = await signRefreshToken(base);
  return { accessToken, refreshToken, expiresIn: 15 * 60 };
}
