export interface User {
  id: string;
  phone: string;
  name: string;
  accountNumber: string;
  balance: number;
  currency: string;
  pinHash: string | null;
  createdAt: string;
  isVerified: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  type: "sent" | "received" | "add_money";
  title: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  note?: string;
  counterparty?: string;
  reference: string;
  provider?: string;
  createdAt: string;
}

export type PaymentMethod = "jazzcash" | "easypaisa" | "bank" | "card" | "internal";
