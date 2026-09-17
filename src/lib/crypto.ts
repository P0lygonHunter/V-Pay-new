import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 12);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

// OTPs are low-entropy (6 digits) but still must never sit in the DB as
// plaintext — a DB leak should not hand out live login codes.
export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

export async function verifyOtpHash(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

export function generateId(prefix = ""): string {
  const id = randomBytes(8).toString("hex");
  return prefix ? `${prefix}_${id}` : id;
}

export function generateOtp(length = 6): string {
  const digits = "0123456789";
  let otp = "";
  const bytes = randomBytes(length);
  for (let i = 0; i < length; i++) otp += digits[bytes[i] % 10];
  return otp;
}

export function generateReference(): string {
  return `VX${Date.now().toString(36).toUpperCase()}${randomBytes(3).toString("hex").toUpperCase()}`;
}
