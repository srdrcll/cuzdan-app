"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, TrendingDown, Wallet, Plus } from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MonthlyChart, CategoryChart, NetWorthChart } from "@/components/charts";
import { AccountList, TransactionList } from "@/components/account-list";
import { formatCurrency } from "@/lib/utils";
import type { DashboardData } from "@/lib/types";
import { TransactionModal } from "@/components/transaction-modal";

export function DashboardView() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"income" | "expense" | "transfer">("expense");

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchDashboard = useCallback((month: number, year: number) => {
    setLoading(true);
    fetch(`/api/dashboard?month=${month}&year=${year}`)
      .then((r) => r.json())
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || pathname !== "/") return;
    fetchDashboard(selectedMonth, selectedYear);
  }, [mounted, pathname, selectedMonth, selectedYear, fetchDashboard]);

  // Card Payment States & Handlers
  const [payCard, setPayCard] = useState<any | null>(null);
  const [payFromAccountId, setPayFromAccountId] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payLoading, setPayLoading] = useState(false);

  const handleOpenPayModal = (card: any) => {
    const sourceAccounts = data ? data.accounts.filter(a => a.type !== "credit_card") : [];
    setPayCard(card);
    setPayAmount(String(Math.abs(card.balance)));
    setPayFromAccountId(sourceAccounts[0]?.id || "");
  };

  const handleConfirmPayment = async () => {
    if (!payCard || !payFromAccountId || !payAmount) return;
    setPayLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "transfer",
          accountId: payFromAccountId,
          toAccountId: payCard.id,
          amount: parseFloat(payAmount),
          description: `${payCard.name} Borç Ödemesi`,
          date: new Date().toISOString().split("T")[0],
        }),
      });

      if (res.ok) {
        setPayCard(null);
        fetchDashboard(selectedMonth, selectedYear);
        alert("Borç ödeme işlemi başarıyla gerçekleştirildi.");
      } else {
        const errData = await res.json();
        alert(errData.error || "Ödeme gerçekleştirilirken bir hata oluştu.");
      }
    } catch (err) {
      console.error("Payment confirmation error:", err);
      alert("Ödeme sırasında bağlantı hatası oluştu.");
    } finally {
      setPayLoading(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Yükleniyor...</p>
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

  const creditCards = data.accounts.filter((acc) => acc.type === "credit_card");

  return (
    <div className="animate-slide-up space-y-5 px-4 pb-4">
      {/* Month/Year selector */}
      <div className="flex items-center justify-between gap-2 p-1.5 px-1">
        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Rapor Dönemi</span>
        <div className="flex gap-2">
          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="rounded-xl border-none bg-muted/40 hover:bg-muted/65 px-3 py-1.5 text-xs text-foreground font-semibold focus:outline-none cursor-pointer transition-colors"
          >
            {Array.from({ length: 12 }, (_, i) => {
              const mIndex = i + 1;
              const mName = new Intl.DateTimeFormat("tr-TR", { month: "long" }).format(new Date(2026, i, 1));
              return (
                <option key={mIndex} value={mIndex}>
                  {mName}
                </option>
              );
            })}
          </select>
          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="rounded-xl border-none bg-muted/40 hover:bg-muted/65 px-3 py-1.5 text-xs text-foreground font-semibold focus:outline-none cursor-pointer transition-colors"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-primary to-indigo-600 !border-0 text-white">
        <CardTitle className="!text-white/70">Toplam Bakiye</CardTitle>
        <p className="mt-1 text-3xl font-bold tracking-tight">
          {formatCurrency(data.totalBalance)}
        </p>
        <div className="mt-4 flex gap-4 items-center">
          <div className="flex items-center gap-1.5 text-sm">
            <TrendingUp size={16} />
            <span>{formatCurrency(data.totalIncome)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <TrendingDown size={16} />
            <span>{formatCurrency(data.totalExpense)}</span>
          </div>
          {data.savingsRate !== undefined && (
            <div className="ml-auto bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full select-none">
              Tasarruf: %{data.savingsRate}
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            setModalType("income");
            setIsModalOpen(true);
          }}
          className="w-full flex-col gap-1 !h-auto !py-3 cursor-pointer"
        >
          <TrendingUp size={18} className="text-emerald-500" />
          <span className="text-xs">Gelir</span>
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setModalType("expense");
            setIsModalOpen(true);
          }}
          className="w-full flex-col gap-1 !h-auto !py-3 cursor-pointer"
        >
          <TrendingDown size={18} className="text-red-500" />
          <span className="text-xs">Gider</span>
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setModalType("transfer");
            setIsModalOpen(true);
          }}
          className="w-full flex-col gap-1 !h-auto !py-3 cursor-pointer"
        >
          <Wallet size={18} className="text-blue-500" />
          <span className="text-xs">Transfer</span>
        </Button>
      </div>

      <MonthlyChart data={data.monthlyData} />
      <CategoryChart data={data.categoryBreakdown} />
      {data.netWorthData && <NetWorthChart data={data.netWorthData} />}

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
              const total = credit.totalAmount || 0;
              const remaining = credit.remainingAmount || 0;
              const progress = total > 0 ? ((total - remaining) / total) * 100 : 0;
              const safeProgress = isNaN(progress) ? 0 : progress;
              return (
                <Card key={credit.id} className="!p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{credit.name || "Kredi"}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(remaining)} kaldı
                    </p>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${safeProgress}%` }}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {creditCards.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Kredi Kartlarım</h2>
          </div>
          <div className="space-y-3">
            {creditCards.map((card) => {
              const currentDebt = Math.abs(card.balance);
              const limit = card.creditLimit || 0;
              const availableLimit = Math.max(0, limit - currentDebt);
              const minPaymentPct = card.minPaymentPct || 40;
              const minPayment = currentDebt * (minPaymentPct / 100);
              const progress = limit > 0 ? (currentDebt / limit) * 100 : 0;

              // Helper to calculate exact next dates handling 30/31 days and leap years
              const getCardDates = (sDay: number, dDay: number) => {
                const now = new Date();
                const year = now.getFullYear();
                const month = now.getMonth();

                const getSafeDay = (y: number, m: number, target: number) => {
                  const lastDay = new Date(y, m + 1, 0).getDate();
                  return Math.min(target, lastDay);
                };

                const sThisMonth = new Date(year, month, getSafeDay(year, month, sDay));
                let sDate: Date;
                let dDate: Date;

                if (now <= sThisMonth) {
                  sDate = sThisMonth;
                  if (dDay > sDay) {
                    dDate = new Date(year, month, getSafeDay(year, month, dDay));
                  } else {
                    dDate = new Date(year, month + 1, getSafeDay(year, month + 1, dDay));
                  }
                } else {
                  sDate = new Date(year, month + 1, getSafeDay(year, month + 1, sDay));
                  if (dDay > sDay) {
                    dDate = new Date(year, month + 1, getSafeDay(year, month + 1, dDay));
                  } else {
                    dDate = new Date(year, month + 2, getSafeDay(year, month + 2, dDay));
                  }
                }
                return { sDate, dDate };
              };

              const { sDate, dDate } = getCardDates(card.statementDay || 15, card.dueDay || 25);

              return (
                <Card key={card.id} className="!p-4 border-l-4" style={{ borderLeftColor: card.color }}>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{card.name}</p>
                    <p className="text-sm font-semibold text-red-500">
                      {formatCurrency(currentDebt)} borç
                    </p>
                  </div>
                  
                  <div className="mt-2.5">
                    <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                      <span>Kullanılan Limit: %{progress.toFixed(0)}</span>
                      <span>Kalan Limit: {formatCurrency(availableLimit)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-red-500 transition-all"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border/50 pt-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-light">Toplam Limit:</span>
                      <span className="font-medium text-foreground">{formatCurrency(limit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-light">Asgari Ödeme:</span>
                      <span className="font-semibold text-foreground">{formatCurrency(minPayment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-light">Hesap Kesim:</span>
                      <span className="font-medium text-foreground">
                        {new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(sDate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-light">Son Ödeme:</span>
                      <span className="font-medium text-foreground">
                        {new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(dDate)}
                      </span>
                    </div>
                  </div>

                  {currentDebt > 0 && (
                    <div className="mt-3 border-t border-border/50 pt-2.5 flex justify-end">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenPayModal(card)}
                        className="text-[10px] font-semibold flex items-center gap-1 py-1 px-3 cursor-pointer select-none bg-primary/10 hover:bg-primary/20 text-primary border-none rounded-xl"
                      >
                        💳 Borç Öde
                      </Button>
                    </div>
                  )}
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

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialType={modalType}
        accounts={data.accounts}
        onSuccess={() => fetchDashboard(selectedMonth, selectedYear)}
      />

      {payCard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in select-none">
          <Card className="w-full max-w-sm p-5 border border-border shadow-2xl bg-background rounded-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-foreground mb-4">💳 Kredi Kartı Borç Ödeme</h3>
            
            <div className="space-y-4">
              {/* Target Card Display */}
              <div className="rounded-xl bg-muted/40 p-3 text-xs border border-border/40">
                <p className="text-muted-foreground">Ödeme Yapılacak Kart</p>
                <p className="font-bold text-foreground mt-0.5">{payCard.name}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Mevcut Borç: <span className="text-red-500 font-semibold">{formatCurrency(Math.abs(payCard.balance))}</span></p>
              </div>

              {/* Source Account Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Kaynak Hesap</label>
                <select
                  value={payFromAccountId}
                  onChange={(e) => setPayFromAccountId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/45 cursor-pointer font-medium"
                >
                  <option value="" disabled>Kaynak Hesap Seçin...</option>
                  {(data?.accounts.filter(a => a.type !== "credit_card") || []).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Tutar (₺)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary/45"
                  placeholder="0.00"
                  required
                />
                
                {/* Fast presets */}
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setPayAmount(String(Math.abs(payCard.balance)))}
                    className="text-[10px] bg-muted/65 hover:bg-muted text-foreground py-1 px-2.5 rounded-lg font-medium cursor-pointer"
                  >
                    Borcun Tamamı
                  </button>
                  {payCard.minPaymentPct && (
                    <button
                      type="button"
                      onClick={() => setPayAmount(String((Math.abs(payCard.balance) * (payCard.minPaymentPct / 100)).toFixed(2)))}
                      className="text-[10px] bg-muted/65 hover:bg-muted text-foreground py-1 px-2.5 rounded-lg font-medium cursor-pointer"
                    >
                      Asgari Tutar (%{payCard.minPaymentPct})
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setPayCard(null)}
                disabled={payLoading}
              >
                İptal
              </Button>
              <Button
                size="sm"
                className="flex-1 text-xs"
                onClick={handleConfirmPayment}
                disabled={payLoading || !payFromAccountId || !payAmount || parseFloat(payAmount) <= 0}
              >
                {payLoading ? "Ödeniyor..." : "Ödeme Yap"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
