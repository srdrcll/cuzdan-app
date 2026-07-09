import Dexie, { type Table } from "dexie";
import { v4 as uuidv4 } from "uuid";

// Interfaces matching database structures
export interface Account {
  id: string;
  name: string;
  type: "cash" | "bank" | "credit_card";
  balance: number;
  color: string;
  creditLimit?: number | null;
  statementDay?: number | null;
  dueDay?: number | null;
  minPaymentPct?: number | null;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  createdAt: Date;
}

export interface Transaction {
  id: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  description: string | null;
  category: string | null;
  accountId: string;
  toAccountId: string | null;
  date: Date;
  linkedTransactionId?: string | null;
  createdAt: Date;
}

export interface CategoryBudget {
  id: string;
  categoryName: string;
  limitAmount: number;
  monthYear: string;
  createdAt: Date;
}

export interface Credit {
  id: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate: number;
  monthlyPayment: number;
  dueDate: string | null;
  createdAt: Date;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface RecurringTransaction {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  categoryId: string | null; // using ID for category is better, or string for name
  accountId: string;
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";
  nextDate: Date;
  totalInstallments?: number | null;
  completedInstallments?: number | null;
  createdAt: Date;
}

class BudgetTrackerDB extends Dexie {
  accounts!: Table<Account, string>;
  categories!: Table<Category, string>;
  transactions!: Table<Transaction, string>;
  categoryBudgets!: Table<CategoryBudget, string>;
  credits!: Table<Credit, string>;
  notifications!: Table<Notification, string>;
  recurringTransactions!: Table<RecurringTransaction, string>;

  constructor() {
    super("BudgetTrackerDatabase");
    this.version(1).stores({
      accounts: "id, name, type, balance",
      categories: "id, name, type",
      transactions: "id, type, amount, category, accountId, toAccountId, date, linkedTransactionId",
      categoryBudgets: "id, categoryName, monthYear, [categoryName+monthYear]",
      credits: "id, accountId",
      notifications: "id, read, createdAt",
    });

    this.version(2).stores({
      recurringTransactions: "id, type, categoryId, accountId, frequency, nextDate"
    });

    this.version(3).stores({
      credits: "id, name"
    });
  }
}

export const db = new BudgetTrackerDB();

export async function seedDatabase() {
  const count = await db.categories.count();
  if (count > 0) return; // DB categories already seeded

  // Seed default categories
  const defaultIncomeCategories = ["Maaş", "Freelance", "Yatırım", "Hediye"];
  const defaultExpenseCategories = [
    "Yemek",
    "Ulaşım",
    "Market",
    "Fatura",
    "Sağlık",
    "Eğlence",
    "Alışveriş",
    "Eğitim",
    "Diğer",
  ];

  for (const name of defaultIncomeCategories) {
    await db.categories.add({
      id: uuidv4(),
      name,
      type: "income",
      createdAt: new Date(),
    });
  }

  for (const name of defaultExpenseCategories) {
    await db.categories.add({
      id: uuidv4(),
      name,
      type: "expense",
      createdAt: new Date(),
    });
  }
}
