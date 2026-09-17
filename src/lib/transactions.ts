import { LedgerDirection, TransactionType } from "@prisma/client";
import { prisma } from "./prisma";

export async function getTransactionsForUser(userId: string, filterType?: string) {
  const entries = await prisma.ledgerEntry.findMany({
    where: { userId },
    include: { transaction: true },
    orderBy: { createdAt: "desc" },
  });

  const rows = entries.map((entry) => {
    const isCredit = entry.direction === LedgerDirection.CREDIT;
    const tx = entry.transaction;

    let displayType: "sent" | "received" | "add_money";
    if (tx.type === TransactionType.ADD_MONEY) displayType = "add_money";
    else displayType = isCredit ? "received" : "sent";

    return {
      id: tx.id,
      type: displayType,
      title:
        tx.type === TransactionType.ADD_MONEY
          ? `Added via ${tx.provider ?? "unknown"}`
          : isCredit
            ? `Received${tx.counterparty ? ` from ${tx.counterparty}` : ""}`
            : `Sent${tx.counterparty ? ` to ${tx.counterparty}` : ""}`,
      amount: entry.amount.toString(),
      currency: tx.currency,
      status: tx.status.toLowerCase(),
      note: tx.note,
      counterparty: tx.counterparty,
      reference: tx.reference,
      provider: tx.provider,
      createdAt: tx.createdAt.toISOString(),
    };
  });

  if (filterType && filterType !== "all") {
    return rows.filter((r) => r.type === filterType);
  }
  return rows;
}
