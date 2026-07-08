"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, Wallet, Plus } from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MonthlyChart, CategoryChart } from "@/components/charts";
import { AccountList, TransactionList } from "@/components/account-list";
import { formatCurrency } from "@/lib/utils";
import type { DashboardData } from "@/lib/types";

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-muted-foreground">Veriler yüklenemedi</p>
      </div>
    );
  }

  return (
    <div className="animate-slide-up space-y-5 px-4 pb-4">
      <Card className="bg-gradient-to-br from-primary to-indigo-600 !border-0 text-white">
        <CardTitle className="!text-white/70">Toplam Bakiye</CardTitle>
        <p className="mt-1 text-3xl font-bold tracking-tight">
          {formatCurrency(data.totalBalance)}
        </p>
        <div className="mt-4 flex gap-4">
          <div className="flex items-center gap-1.5 text-sm">
            <TrendingUp size={16} />
            <span>{formatCurrency(data.totalIncome)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <TrendingDown size={16} />
            <span>{formatCurrency(data.totalExpense)}</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <Link href="/transactions/income">
          <Button variant="secondary" className="w-full flex-col gap-1 !h-auto !py-3">
            <TrendingUp size={18} className="text-emerald-500" />
            <span className="text-xs">Gelir</span>
          </Button>
        </Link>
        <Link href="/transactions/expense">
          <Button variant="secondary" className="w-full flex-col gap-1 !h-auto !py-3">
            <TrendingDown size={18} className="text-red-500" />
            <span className="text-xs">Gider</span>
          </Button>
        </Link>
        <Link href="/transactions/transfer">
          <Button variant="secondary" className="w-full flex-col gap-1 !h-auto !py-3">
            <Wallet size={18} className="text-blue-500" />
            <span className="text-xs">Transfer</span>
          </Button>
        </Link>
      </div>

      <MonthlyChart data={data.monthlyData} />
      <CategoryChart data={data.categoryBreakdown} />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Hesaplarım</h2>
          <Link href="/accounts/new">
            <Button variant="ghost" size="sm">
              <Plus size={16} className="mr-1" /> Ekle
            </Button>
          </Link>
        </div>
        <AccountList accounts={data.accounts} />
      </div>

      {data.credits.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Krediler</h2>
            <Link href="/credits" className="text-sm text-primary">
              Tümü
            </Link>
          </div>
          <div className="space-y-2">
            {data.credits.slice(0, 3).map((credit) => {
              const progress =
                ((credit.totalAmount - credit.remainingAmount) / credit.totalAmount) * 100;
              return (
                <Card key={credit.id} className="!p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{credit.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(credit.remainingAmount)} kaldı
                    </p>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Son İşlemler</h2>
          <Link href="/transactions" className="text-sm text-primary">
            Tümü
          </Link>
        </div>
        <TransactionList transactions={data.recentTransactions} />
      </div>
    </div>
  );
}
