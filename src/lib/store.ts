import { User, Transaction } from "./types";
import { hashPin } from "./crypto";

const g = globalThis as unknown as {
  __vxUsers?: Map<string, User>;
  __vxTxs?: Map<string, Transaction>;
  __vxOtps?: Map<string, { code: string; expires: number }>;
  __vxRefresh?: Set<string>;
  __vxSeeded?: boolean;
};

function users() {
  if (!g.__vxUsers) g.__vxUsers = new Map();
  return g.__vxUsers;
}
function txs() {
  if (!g.__vxTxs) g.__vxTxs = new Map();
  return g.__vxTxs;
}
function otps() {
  if (!g.__vxOtps) g.__vxOtps = new Map();
  return g.__vxOtps;
}
function refreshTokens() {
  if (!g.__vxRefresh) g.__vxRefresh = new Set();
  return g.__vxRefresh;
}

async function ensureSeed() {
  if (g.__vxSeeded) return;
  g.__vxSeeded = true;
  const pinHash = await hashPin("1234");
  const demo: User = {
    id: "user_demo_001",
    phone: "+923001234567",
    name: "Ahmed Khan",
    accountNumber: "03XX-XXXXXXX",
    balance: 248650,
    currency: "PKR",
    pinHash,
    createdAt: new Date().toISOString(),
    isVerified: true,
  };
  users().set(demo.id, demo);
  users().set(demo.phone, demo);

  const demoTxs: Transaction[] = [
    { id: "tx_001", userId: demo.id, type: "received", title: "Received from Sara Ahmed", amount: 15000, currency: "PKR", status: "completed", note: "Rent share", counterparty: "Sara Ahmed", reference: "VXREF001", createdAt: "2026-09-15T14:32:00Z" },
    { id: "tx_002", userId: demo.id, type: "sent", title: "Sent to Ali Raza", amount: 3500, currency: "PKR", status: "completed", note: "Dinner", counterparty: "Ali Raza", reference: "VXREF002", createdAt: "2026-09-14T19:15:00Z" },
    { id: "tx_003", userId: demo.id, type: "received", title: "Received from Bank Transfer", amount: 50000, currency: "PKR", status: "completed", note: "Salary", reference: "VXREF003", createdAt: "2026-09-13T11:08:00Z" },
    { id: "tx_004", userId: demo.id, type: "sent", title: "Sent to JazzCash", amount: 2000, currency: "PKR", status: "completed", note: "Mobile load", provider: "jazzcash", reference: "VXREF004", createdAt: "2026-09-12T16:45:00Z" },
  ];
  demoTxs.forEach((t) => txs().set(t.id, t));
}

export const store = {
  async ready() {
    await ensureSeed();
  },
  getUserById: (id: string) => users().get(id),
  getUserByPhone: (phone: string) => users().get(phone),
  saveUser: (user: User) => {
    users().set(user.id, user);
    users().set(user.phone, user);
  },
  updateBalance: (userId: string, balance: number) => {
    const u = users().get(userId);
    if (u) {
      u.balance = balance;
      users().set(userId, u);
      users().set(u.phone, u);
    }
  },
  addTransaction: (tx: Transaction) => txs().set(tx.id, tx),
  getTransactions: (userId: string, type?: string) => {
    let list = Array.from(txs().values()).filter((t) => t.userId === userId);
    if (type && type !== "all") list = list.filter((t) => t.type === type);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  getTransaction: (id: string) => txs().get(id),
  setOtp: (phone: string, code: string, ttlMs = 300000) => {
    otps().set(phone, { code, expires: Date.now() + ttlMs });
  },
  verifyOtp: (phone: string, code: string) => {
    const e = otps().get(phone);
    if (!e || Date.now() > e.expires) {
      otps().delete(phone);
      return false;
    }
    const ok = e.code === code;
    if (ok) otps().delete(phone);
    return ok;
  },
  addRefreshToken: (t: string) => refreshTokens().add(t),
  hasRefreshToken: (t: string) => refreshTokens().has(t),
  revokeRefreshToken: (t: string) => refreshTokens().delete(t),
};
