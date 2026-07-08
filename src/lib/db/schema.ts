import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["cash", "bank", "credit_card"] }).notNull(),
  balance: real("balance").notNull().default(0),
  currency: text("currency").notNull().default("TRY"),
  color: text("color").notNull().default("#6366f1"),
  creditLimit: real("credit_limit"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  type: text("type", { enum: ["income", "expense", "transfer"] }).notNull(),
  amount: real("amount").notNull(),
  description: text("description"),
  category: text("category"),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id),
  toAccountId: text("to_account_id").references(() => accounts.id),
  date: integer("date", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const credits = sqliteTable("credits", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  totalAmount: real("total_amount").notNull(),
  remainingAmount: real("remaining_amount").notNull(),
  interestRate: real("interest_rate").notNull().default(0),
  monthlyPayment: real("monthly_payment").notNull().default(0),
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  dueDate: integer("due_date", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type", {
    enum: ["info", "warning", "success", "payment_due"],
  }).notNull(),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Credit = typeof credits.$inferSelect;
export type NewCredit = typeof credits.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
