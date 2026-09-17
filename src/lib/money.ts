import { Prisma, LedgerDirection, TransactionStatus, TransactionType } from "@prisma/client";
import { prisma } from "./prisma";
import { generateReference } from "./crypto";

export class InsufficientBalanceError extends Error {
  constructor() {
    super("Insufficient balance");
    this.name = "InsufficientBalanceError";
  }
}

export class UserNotFoundError extends Error {
  constructor() {
    super("User not found");
    this.name = "UserNotFoundError";
  }
}

type UserBalanceRow = { id: string; balance: string };

/**
 * Moves money from one user to another (or to an external counterparty
 * string, if the recipient isn't a registered internal user — e.g. a
 * mobile-load top-up). Fully atomic: row-locks the sender (and recipient,
 * if internal) inside a single DB transaction so two concurrent sends
 * from the same user can never both read a stale balance and overdraw it.
 *
 * idempotencyKey: pass the client's idempotency key (e.g. a UUID the
 * frontend generates once per tap of "Send") so retried requests (double
 * taps, client timeout + retry) do not double-charge the sender.
 */
export async function sendMoney(params: {
  senderId: string;
  toAccountNumberOrPhone: string;
  amount: number;
  note?: string;
  idempotencyKey?: string;
}) {
  const { senderId, toAccountNumberOrPhone, amount, note, idempotencyKey } = params;
  const amountDecimal = new Prisma.Decimal(amount);

  return prisma.$transaction(async (tx) => {
    if (idempotencyKey) {
      const existing = await tx.transaction.findUnique({ where: { idempotencyKey } });
      if (existing) return existing;
    }

    // Row-lock the sender so a concurrent second request can't read the
    // same pre-debit balance before this one commits.
    const senderRows = await tx.$queryRaw<UserBalanceRow[]>`
      SELECT id, balance FROM "User" WHERE id = ${senderId} FOR UPDATE
    `;
    const sender = senderRows[0];
    if (!sender) throw new UserNotFoundError();

    const senderBalance = new Prisma.Decimal(sender.balance);
    if (senderBalance.lessThan(amountDecimal)) throw new InsufficientBalanceError();

    // Look up (and lock, if found) an internal recipient by account
    // number or phone. Not finding one is not an error — it just means
    // this is money leaving the system (e.g. external mobile-load), so
    // only a debit ledger entry is recorded.
    const recipientRows = await tx.$queryRaw<UserBalanceRow[]>`
      SELECT id, balance FROM "User"
      WHERE "accountNumber" = ${toAccountNumberOrPhone} OR phone = ${toAccountNumberOrPhone}
      FOR UPDATE
    `;
    const recipient = recipientRows[0];

    const newSenderBalance = senderBalance.minus(amountDecimal);

    const transaction = await tx.transaction.create({
      data: {
        type: TransactionType.SENT,
        status: TransactionStatus.COMPLETED,
        amount: amountDecimal,
        note,
        counterparty: toAccountNumberOrPhone,
        reference: generateReference(),
        idempotencyKey,
        ownerUserId: senderId,
      },
    });

    await tx.user.update({
      where: { id: senderId },
      data: { balance: newSenderBalance, version: { increment: 1 } },
    });

    await tx.ledgerEntry.create({
      data: {
        transactionId: transaction.id,
        userId: senderId,
        direction: LedgerDirection.DEBIT,
        amount: amountDecimal,
        balanceAfter: newSenderBalance,
      },
    });

    if (recipient) {
      const newRecipientBalance = new Prisma.Decimal(recipient.balance).plus(amountDecimal);

      await tx.user.update({
        where: { id: recipient.id },
        data: { balance: newRecipientBalance, version: { increment: 1 } },
      });

      await tx.ledgerEntry.create({
        data: {
          transactionId: transaction.id,
          userId: recipient.id,
          direction: LedgerDirection.CREDIT,
          amount: amountDecimal,
          balanceAfter: newRecipientBalance,
        },
      });
    }

    return transaction;
  });
}

/**
 * Creates a PENDING add-money transaction. This does NOT touch the
 * user's balance — that was last version's critical bug (client could
 * credit itself arbitrary amounts). Balance is only ever credited by
 * confirmPendingAddMoney(), which must be called from a verified
 * payment-gateway webhook (JazzCash/EasyPaisa/bank), never directly
 * from a client request. Wiring that webhook is item #3 (real gateway
 * integration) — until that exists, this transaction will sit at
 * PENDING forever, which is the correct and safe behavior.
 */
export async function createPendingAddMoney(params: {
  userId: string;
  amount: number;
  method: string;
  idempotencyKey?: string;
}) {
  const { userId, amount, method, idempotencyKey } = params;
  const amountDecimal = new Prisma.Decimal(amount);

  if (idempotencyKey) {
    const existing = await prisma.transaction.findUnique({ where: { idempotencyKey } });
    if (existing) return existing;
  }

  return prisma.transaction.create({
    data: {
      type: TransactionType.ADD_MONEY,
      status: TransactionStatus.PENDING,
      amount: amountDecimal,
      provider: method,
      reference: generateReference(),
      idempotencyKey,
      ownerUserId: userId,
    },
  });
}

/**
 * Called ONLY from a verified gateway webhook once the real payment is
 * confirmed. Atomically flips the transaction to COMPLETED and credits
 * the user's balance exactly once (guarded by the transaction's current
 * status, so a duplicate/replayed webhook call is a no-op).
 */
export async function confirmPendingAddMoney(transactionId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.transaction.findUnique({ where: { id: transactionId } });
    if (!existing) throw new Error("Transaction not found");
    if (existing.ownerUserId !== userId) throw new Error("Transaction does not belong to this user");
    if (existing.status !== TransactionStatus.PENDING) return existing; // already handled — idempotent

    const userRows = await tx.$queryRaw<UserBalanceRow[]>`
      SELECT id, balance FROM "User" WHERE id = ${userId} FOR UPDATE
    `;
    const user = userRows[0];
    if (!user) throw new UserNotFoundError();

    const newBalance = new Prisma.Decimal(user.balance).plus(existing.amount);

    await tx.user.update({
      where: { id: userId },
      data: { balance: newBalance, version: { increment: 1 } },
    });

    await tx.ledgerEntry.create({
      data: {
        transactionId: existing.id,
        userId,
        direction: LedgerDirection.CREDIT,
        amount: existing.amount,
        balanceAfter: newBalance,
      },
    });

    return tx.transaction.update({
      where: { id: existing.id },
      data: { status: TransactionStatus.COMPLETED },
    });
  });
}
