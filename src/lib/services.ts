import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getDb, schema } from "@/lib/db";
import type { DashboardData } from "@/lib/types";

export async function getAllAccounts() {
  const db = getDb();
  return db.select().from(schema.accounts).orderBy(desc(schema.accounts.createdAt));
}

export async function getAccountById(id: string) {
  const db = getDb();
  const [account] = await db
    .select()
    .from(schema.accounts)
    .where(eq(schema.accounts.id, id));
  return account ?? null;
}

export async function createAccount(data: {
  name: string;
  type: "cash" | "bank" | "credit_card";
  balance?: number;
  currency?: string;
  color?: string;
  creditLimit?: number;
}) {
  const db = getDb();
  const account = {
    id: uuidv4(),
    name: data.name,
    type: data.type,
    balance:
      data.type === "credit_card" && data.balance
        ? -Math.abs(data.balance)
        : (data.balance ?? 0),
    currency: data.currency ?? "TRY",
    color: data.color ?? "#6366f1",
    creditLimit: data.type === "credit_card" ? data.creditLimit : null,
    createdAt: new Date(),
  };
  await db.insert(schema.accounts).values(account);
  return account;
}

export async function deleteAccount(id: string) {
  const db = getDb();
  await db.delete(schema.accounts).where(eq(schema.accounts.id, id));
}

export async function getAllTransactions(limit?: number) {
  const db = getDb();
  const query = db
    .select({
      id: schema.transactions.id,
      type: schema.transactions.type,
      amount: schema.transactions.amount,
      description: schema.transactions.description,
      category: schema.transactions.category,
      accountId: schema.transactions.accountId,
      toAccountId: schema.transactions.toAccountId,
      date: schema.transactions.date,
      createdAt: schema.transactions.createdAt,
      accountName: schema.accounts.name,
    })
    .from(schema.transactions)
    .innerJoin(
      schema.accounts,
      eq(schema.transactions.accountId, schema.accounts.id)
    )
    .orderBy(desc(schema.transactions.date));

  if (limit) {
    return query.limit(limit);
  }
  return query;
}

export async function createIncome(data: {
  accountId: string;
  amount: number;
  description?: string;
  category?: string;
  date?: Date;
}) {
  const db = getDb();
  const account = await getAccountById(data.accountId);
  if (!account) throw new Error("Hesap bulunamadı");

  const transaction = {
    id: uuidv4(),
    type: "income" as const,
    amount: data.amount,
    description: data.description ?? null,
    category: data.category ?? null,
    accountId: data.accountId,
    toAccountId: null,
    date: data.date ?? new Date(),
    createdAt: new Date(),
  };

  await db.insert(schema.transactions).values(transaction);
  await db
    .update(schema.accounts)
    .set({ balance: account.balance + data.amount })
    .where(eq(schema.accounts.id, data.accountId));

  return transaction;
}

export async function createExpense(data: {
  accountId: string;
  amount: number;
  description?: string;
  category?: string;
  date?: Date;
}) {
  const db = getDb();
  const account = await getAccountById(data.accountId);
  if (!account) throw new Error("Hesap bulunamadı");

  const transaction = {
    id: uuidv4(),
    type: "expense" as const,
    amount: data.amount,
    description: data.description ?? null,
    category: data.category ?? null,
    accountId: data.accountId,
    toAccountId: null,
    date: data.date ?? new Date(),
    createdAt: new Date(),
  };

  await db.insert(schema.transactions).values(transaction);

  const newBalance =
    account.type === "credit_card"
      ? account.balance - data.amount
      : account.balance - data.amount;

  await db
    .update(schema.accounts)
    .set({ balance: newBalance })
    .where(eq(schema.accounts.id, data.accountId));

  return transaction;
}

export async function createTransfer(data: {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
  date?: Date;
}) {
  const db = getDb();
  if (data.fromAccountId === data.toAccountId) {
    throw new Error("Aynı hesaba transfer yapılamaz");
  }

  const fromAccount = await getAccountById(data.fromAccountId);
  const toAccount = await getAccountById(data.toAccountId);
  if (!fromAccount || !toAccount) throw new Error("Hesap bulunamadı");

  const transaction = {
    id: uuidv4(),
    type: "transfer" as const,
    amount: data.amount,
    description: data.description ?? null,
    category: null,
    accountId: data.fromAccountId,
    toAccountId: data.toAccountId,
    date: data.date ?? new Date(),
    createdAt: new Date(),
  };

  await db.insert(schema.transactions).values(transaction);
  await db
    .update(schema.accounts)
    .set({ balance: fromAccount.balance - data.amount })
    .where(eq(schema.accounts.id, data.fromAccountId));
  await db
    .update(schema.accounts)
    .set({ balance: toAccount.balance + data.amount })
    .where(eq(schema.accounts.id, data.toAccountId));

  return transaction;
}

export async function getAllCredits() {
  const db = getDb();
  return db.select().from(schema.credits).orderBy(desc(schema.credits.createdAt));
}

export async function createCredit(data: {
  name: string;
  totalAmount: number;
  remainingAmount?: number;
  interestRate?: number;
  monthlyPayment?: number;
  startDate?: Date;
  dueDate?: Date;
}) {
  const db = getDb();
  const credit = {
    id: uuidv4(),
    name: data.name,
    totalAmount: data.totalAmount,
    remainingAmount: data.remainingAmount ?? data.totalAmount,
    interestRate: data.interestRate ?? 0,
    monthlyPayment: data.monthlyPayment ?? 0,
    startDate: data.startDate ?? new Date(),
    dueDate: data.dueDate ?? null,
    createdAt: new Date(),
  };
  await db.insert(schema.credits).values(credit);

  if (data.dueDate) {
    await createNotification({
      title: "Kredi ödeme hatırlatması",
      message: `${data.name} kredisi için ödeme tarihi yaklaşıyor.`,
      type: "payment_due",
    });
  }

  return credit;
}

export async function payCredit(id: string, amount: number, accountId: string) {
  const db = getDb();
  const [credit] = await db
    .select()
    .from(schema.credits)
    .where(eq(schema.credits.id, id));
  if (!credit) throw new Error("Kredi bulunamadı");

  const newRemaining = Math.max(0, credit.remainingAmount - amount);
  await db
    .update(schema.credits)
    .set({ remainingAmount: newRemaining })
    .where(eq(schema.credits.id, id));

  await createExpense({
    accountId,
    amount,
    description: `${credit.name} kredi ödemesi`,
    category: "Diğer",
  });

  if (newRemaining === 0) {
    await createNotification({
      title: "Kredi tamamlandı!",
      message: `${credit.name} kredisi başarıyla ödendi.`,
      type: "success",
    });
  }

  return { ...credit, remainingAmount: newRemaining };
}

export async function getNotifications() {
  const db = getDb();
  return db
    .select()
    .from(schema.notifications)
    .orderBy(desc(schema.notifications.createdAt));
}

export async function createNotification(data: {
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "payment_due";
}) {
  const db = getDb();
  const notification = {
    id: uuidv4(),
    title: data.title,
    message: data.message,
    type: data.type,
    read: false,
    createdAt: new Date(),
  };
  await db.insert(schema.notifications).values(notification);
  return notification;
}

export async function markNotificationRead(id: string) {
  const db = getDb();
  await db
    .update(schema.notifications)
    .set({ read: true })
    .where(eq(schema.notifications.id, id));
}

export async function markAllNotificationsRead() {
  const db = getDb();
  await db.update(schema.notifications).set({ read: true });
}

export async function getDashboardData(): Promise<DashboardData> {
  const db = getDb();
  const allAccounts = await getAllAccounts();
  const allCredits = await getAllCredits();
  const allNotifications = await getNotifications();
  const recentTx = await getAllTransactions(10);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const monthTransactions = await db
    .select()
    .from(schema.transactions)
    .where(
      and(
        gte(schema.transactions.date, startOfMonth),
        lte(schema.transactions.date, endOfMonth)
      )
    );

  const totalIncome = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = allAccounts.reduce((sum, a) => {
    if (a.type === "credit_card") {
      return sum - Math.abs(a.balance);
    }
    return sum + a.balance;
  }, 0);

  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

    const monthTx = await db
      .select()
      .from(schema.transactions)
      .where(
        and(
          gte(schema.transactions.date, monthStart),
          lte(schema.transactions.date, monthEnd)
        )
      );

    monthlyData.push({
      month: new Intl.DateTimeFormat("tr-TR", { month: "short" }).format(d),
      income: monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      expense: monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    });
  }

  const categoryBreakdown = await db
    .select({
      category: schema.transactions.category,
      amount: sql<number>`sum(${schema.transactions.amount})`.as("amount"),
    })
    .from(schema.transactions)
    .where(
      and(
        eq(schema.transactions.type, "expense"),
        gte(schema.transactions.date, startOfMonth),
        lte(schema.transactions.date, endOfMonth)
      )
    )
    .groupBy(schema.transactions.category);

  const toAccountNames = new Map<string, string>();
  for (const acc of allAccounts) {
    toAccountNames.set(acc.id, acc.name);
  }

  return {
    totalBalance,
    totalIncome,
    totalExpense,
    accounts: allAccounts.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      balance: a.balance,
      color: a.color,
      creditLimit: a.creditLimit,
    })),
    recentTransactions: recentTx.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      category: t.category,
      date: t.date.toISOString(),
      accountName: t.accountName,
      toAccountName: t.toAccountId ? toAccountNames.get(t.toAccountId) : null,
    })),
    monthlyData,
    categoryBreakdown: categoryBreakdown
      .filter((c) => c.category)
      .map((c) => ({
        category: c.category!,
        amount: c.amount,
      })),
    credits: allCredits.map((c) => ({
      id: c.id,
      name: c.name,
      remainingAmount: c.remainingAmount,
      totalAmount: c.totalAmount,
      monthlyPayment: c.monthlyPayment,
      dueDate: c.dueDate?.toISOString() ?? null,
    })),
    unreadNotifications: allNotifications.filter((n) => !n.read).length,
  };
}

export async function checkCreditCardLimits() {
  const accounts = await getAllAccounts();
  for (const account of accounts) {
    if (
      account.type === "credit_card" &&
      account.creditLimit &&
      Math.abs(account.balance) >= account.creditLimit * 0.9
    ) {
      await createNotification({
        title: "Kredi kartı limiti uyarısı",
        message: `${account.name} kartınız limitin %90'ına ulaştı.`,
        type: "warning",
      });
    }
  }
}
