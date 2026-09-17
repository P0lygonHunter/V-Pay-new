import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasUpstash = !!process.env.UPSTASH_REDIS_KV_REST_API_URL && !!process.env.UPSTASH_REDIS_KV_REST_API_TOKEN;

// If Upstash isn't configured yet, rate limiting is skipped rather than
// crashing every request. This is a deliberate, visible trade-off — see
// the setup notes given alongside this file. Do NOT treat "not
// configured" as "safe to ignore forever": OTP request/verify and login
// are brute-force targets and must not ship to real users without this
// wired up.
let otpRequestLimiter: Ratelimit | null = null;
let otpVerifyLimiter: Ratelimit | null = null;
let sendLimiter: Ratelimit | null = null;

if (hasUpstash) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_KV_REST_API_URL!,
    token: process.env.UPSTASH_REDIS_KV_REST_API_TOKEN!,
  });

  // OTP request: 5 per phone number per 10 minutes — stops SMS-bombing
  // a victim's number and stops enumerating phone numbers cheaply.
  otpRequestLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "10 m"),
    prefix: "rl:otp-request",
  });

  // OTP verify: 5 attempts per phone per 10 minutes — a 6-digit code has
  // only 1,000,000 combinations; without this, it's brute-forceable in
  // minutes even with the per-attempt DB counter in OtpChallenge.
  otpVerifyLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "10 m"),
    prefix: "rl:otp-verify",
  });

  // Send-money: 20 per user per minute — generous for real usage, tight
  // enough to blunt a compromised-token script draining a wallet fast.
  sendLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 m"),
    prefix: "rl:send",
  });
}

export type RateLimitResult = { success: boolean; limit: number; remaining: number };

async function check(limiter: Ratelimit | null, key: string): Promise<RateLimitResult> {
  if (!limiter) return { success: true, limit: -1, remaining: -1 };
  const result = await limiter.limit(key);
  return { success: result.success, limit: result.limit, remaining: result.remaining };
}

export const rateLimit = {
  otpRequest: (phone: string) => check(otpRequestLimiter, phone),
  otpVerify: (phone: string) => check(otpVerifyLimiter, phone),
  send: (userId: string) => check(sendLimiter, userId),
  isConfigured: hasUpstash,
};
