import { User, Transaction } from "./types";
import { hashPin } from "./crypto";

const globalStore = globalThis as unknown as {
  __vortexUsers?: Map<string, User>;
  __vortexTxs?: Map<string, Transaction>;
  __vortexOtps?: Map<string, { code: string; expires: number }>;
  __vortexRefresh?: Set<string>;
  __vortexSeeded?: boolean;
};

function users() {
  if (!globalStore.__vortexUsers) globalStore.__vortexUsers = new Map();
  return globalStore.__vortexUsers;
}
function txs() {
  if (!globalStore.__vortexTxs) globalStore.__vortexTxs = new Map();
  return globalStore.__vortexTxs;
}
function otps() {
  if (!globalStore.__vortexOtps) globalStore.__vortexOtps = new Map();
  return globalStore.__vortexOtps;
}
function refreshTokens() {
  if (!globalStore.__vortexRefresh) globalStore.__vortexRefresh = new Set();
  return globalStore.__vortexRefresh;
}

async function seed() {
  if (globalStore.__vortexSeeded) return;
  globalStore.__vortexSeeded = true;
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

seed();

export const store = {
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
