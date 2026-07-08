"use client";

import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Wallet,
  Building2,
  CreditCard,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  cn,
  formatCurrency,
  formatShortDate,
  TRANSACTION_TYPES,
  ACCOUNT_TYPES,
} from "@/lib/utils";

const iconMap = {
  Wallet,
  Building2,
  CreditCard,
};

interface AccountListProps {
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    balance: number;
    color: string;
    creditLimit?: number | null;
  }>;
}

export function AccountList({ accounts }: AccountListProps) {
  if (accounts.length === 0) {
    return (
      <Card>
        <p className="py-4 text-center text-sm text-muted-foreground">
          Henüz hesap eklenmemiş.{" "}
          <Link href="/accounts/new" className="text-primary underline">
            Hesap oluştur
          </Link>
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {accounts.map((account) => {
        const typeInfo = ACCOUNT_TYPES[account.type as keyof typeof ACCOUNT_TYPES];
        const Icon = iconMap[typeInfo.icon as keyof typeof iconMap];
        const isCredit = account.type === "credit_card";

        return (
          <Card key={account.id} className="flex items-center gap-3 !p-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${account.color}20`, color: account.color }}
            >
              <Icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{account.name}</p>
              <p className="text-xs text-muted-foreground">{typeInfo.label}</p>
            </div>
            <div className="text-right">
              <p
                className={cn(
                  "text-sm font-semibold",
                  isCredit && account.balance < 0 && "text-danger"
                )}
              >
                {isCredit
                  ? formatCurrency(Math.abs(account.balance))
                  : formatCurrency(account.balance)}
              </p>
              {isCredit && account.creditLimit && (
                <p className="text-xs text-muted-foreground">
                  Limit: {formatCurrency(account.creditLimit)}
                </p>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

interface TransactionListProps {
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string | null;
    category: string | null;
    date: string;
    accountName: string;
    toAccountName?: string | null;
  }>;
}

export function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <Card>
        <p className="py-4 text-center text-sm text-muted-foreground">
          Henüz işlem yok
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const typeInfo = TRANSACTION_TYPES[tx.type as keyof typeof TRANSACTION_TYPES];
        const Icon =
          tx.type === "income"
            ? ArrowDownLeft
            : tx.type === "expense"
              ? ArrowUpRight
              : ArrowLeftRight;

        return (
          <Card key={tx.id} className="flex items-center gap-3 !p-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl bg-muted",
                typeInfo.color
              )}
            >
              <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">
                {tx.description || tx.category || typeInfo.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {tx.accountName}
                {tx.toAccountName && ` → ${tx.toAccountName}`}
                {" · "}
                {formatShortDate(tx.date)}
              </p>
            </div>
            <p className={cn("text-sm font-semibold", typeInfo.color)}>
              {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
              {formatCurrency(tx.amount)}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
