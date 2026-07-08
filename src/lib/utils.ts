import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "TRY"): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatShortDate(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
  }).format(d);
}

export const ACCOUNT_TYPES = {
  cash: { label: "Nakit", icon: "Wallet" },
  bank: { label: "Banka", icon: "Building2" },
  credit_card: { label: "Kredi Kartı", icon: "CreditCard" },
} as const;

export const TRANSACTION_TYPES = {
  income: { label: "Gelir", color: "text-emerald-500" },
  expense: { label: "Gider", color: "text-red-500" },
  transfer: { label: "Transfer", color: "text-blue-500" },
} as const;

export const EXPENSE_CATEGORIES = [
  "Yemek",
  "Ulaşım",
  "Market",
  "Fatura",
  "Sağlık",
  "Eğlence",
  "Alışveriş",
  "Eğitim",
  "Diğer",
] as const;

export const INCOME_CATEGORIES = [
  "Maaş",
  "Freelance",
  "Yatırım",
  "Hediye",
  "Diğer",
] as const;

export const ACCOUNT_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
] as const;
