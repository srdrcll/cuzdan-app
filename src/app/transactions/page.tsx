"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  HeartPulse,
  Gamepad2,
  GraduationCap,
  Sparkles,
  HelpCircle,
  Briefcase,
  Layers,
  Inbox,
  Plus,
  Search,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

// Mappings for category icons
const categoryIconMap: Record<string, any> = {
  // Expense
  "Yemek": Utensils,
  "Ulaşım": Car,
  "Market": ShoppingBag,
  "Fatura": Receipt,
  "Sağlık": HeartPulse,
  "Eğlence": Gamepad2,
  "Alışveriş": ShoppingBag,
  "Eğitim": GraduationCap,
  "Diğer": HelpCircle,
  
  // Income
  "Maaş": Briefcase,
  "Freelance": Sparkles,
  "Yatırım": Layers,
  "Hediye": Sparkles,
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Selection & Bulk Action States
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((res) => { if (res.data) setAccounts(res.data); })
      .catch((err) => console.error("Error loading accounts:", err));
      
    fetch("/api/categories")
      .then((r) => r.json())
      .then((res) => { if (res.data) setCategories(res.data); })
      .catch((err) => console.error("Error loading categories:", err));
  }, []);

  const fetchTransactions = useCallback(() => {
    setLoading(true);
    fetch(
      `/api/transactions?search=${encodeURIComponent(
        searchQuery
      )}&month=${selectedMonth}&year=${selectedYear}&accountId=${selectedAccountId}&category=${encodeURIComponent(
        selectedCategory
      )}`
    )
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          setTransactions(res.data);
        }
      })
      .catch((err) => console.error("Error loading transactions:", err))
      .finally(() => setLoading(false));
  }, [searchQuery, selectedMonth, selectedYear, selectedAccountId, selectedCategory]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTransactions();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [fetchTransactions]);

  const handleSelectToggle = (id: string) => {
    const newSelected = new Set(selectedTxIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTxIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedTxIds.size === 0) return;
    const confirmDelete = window.confirm(`Seçilen ${selectedTxIds.size} işlemi silmek istediğinize emin misiniz? Bu işlem ilgili hesap bakiyelerini güncelleyecektir.`);
    if (!confirmDelete) return;

    setBulkActionLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedTxIds) }),
      });
      if (res.ok) {
        setSelectedTxIds(new Set());
        fetchTransactions();
        alert("Seçilen işlemler başarıyla silindi.");
      } else {
        alert("İşlemler silinirken hata oluştu.");
      }
    } catch (err) {
      console.error("Bulk delete error:", err);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkCategoryChange = async (catName: string) => {
    if (selectedTxIds.size === 0 || !catName) return;

    setBulkActionLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk-edit",
          ids: Array.from(selectedTxIds),
          category: catName,
        }),
      });
      if (res.ok) {
        setSelectedTxIds(new Set());
        setBulkCategory("");
        fetchTransactions();
        alert("Seçilen işlemlerin kategorisi güncellendi.");
      } else {
        alert("Kategori güncellenirken hata oluştu.");
      }
    } catch (err) {
      console.error("Bulk edit error:", err);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Helper to group transactions by date
  const groupTransactionsByDate = (txs: any[]) => {
    const groups: Record<string, any[]> = {};
    const todayStr = new Date().toLocaleDateString("tr-TR");
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString("tr-TR");

    txs.forEach((tx) => {
      const txDate = new Date(tx.date);
      const dateStr = txDate.toLocaleDateString("tr-TR");
      
      let key = dateStr;
      if (dateStr === todayStr) {
        key = "Bugün";
      } else if (dateStr === yesterdayStr) {
        key = "Dün";
      } else {
        key = new Intl.DateTimeFormat("tr-TR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(txDate);
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(tx);
    });

    return groups;
  };

  const groupedTx = groupTransactionsByDate(transactions);

  return (
    <>
      <Header title="İşlemler" />
      <div className="space-y-4 px-4 py-4 animate-slide-up">
        {/* Navigation Quick Filters */}
        <div className="grid grid-cols-3 gap-2">
          <Link href="/transactions/income">
            <Button variant="secondary" className="w-full flex-col gap-1 !h-auto !py-2 transition-colors">
              <TrendingUp size={15} className="text-emerald-500" />
              <span className="text-[10px] font-semibold">Gelir</span>
            </Button>
          </Link>
          <Link href="/transactions/expense">
            <Button variant="secondary" className="w-full flex-col gap-1 !h-auto !py-2 transition-colors">
              <TrendingDown size={15} className="text-red-500" />
              <span className="text-[10px] font-semibold">Gider</span>
            </Button>
          </Link>
          <Link href="/transactions/transfer">
            <Button variant="secondary" className="w-full flex-col gap-1 !h-auto !py-2 transition-colors">
              <ArrowLeftRight size={15} className="text-blue-500" />
              <span className="text-[10px] font-semibold">Transfer</span>
            </Button>
          </Link>
        </div>

        {/* Search and Filters Section */}
        <div className="space-y-2 border-t border-border/40 pt-3">
          <div className="flex gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/80" />
              <input
                type="text"
                placeholder="Açıklamalarda ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/45 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Month Dropdown */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/45 cursor-pointer font-medium"
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

            {/* Year Dropdown */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-28 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/45 cursor-pointer font-medium"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* Account Filter */}
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/45 cursor-pointer font-medium"
            >
              <option value="">Tüm Hesaplar</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/45 cursor-pointer font-medium"
            >
              <option value="">Tüm Kategoriler</option>
              {Array.from(new Set([
                "Yemek", "Ulaşım", "Market", "Fatura", "Sağlık", "Eğlence", "Alışveriş", "Eğitim", "Maaş", "Freelance", "Yatırım", "Hediye", "Diğer",
                ...categories.map(c => c.name)
              ])).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State Skeleton */}
        {loading && (
          <div className="space-y-4 pt-2">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-16 rounded bg-muted/60 animate-pulse mb-2" />
                <div className="space-y-2">
                  {[1, 2].map((j) => (
                    <Card key={j} className="flex items-center gap-3 !p-3 bg-card/60 animate-pulse border-border/40">
                      <div className="h-10 w-10 rounded-xl bg-muted" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-4 w-28 rounded bg-muted" />
                        <div className="h-3 w-36 rounded bg-muted/70" />
                      </div>
                      <div className="h-4 w-16 rounded bg-muted" />
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State Screen */}
        {!loading && transactions.length === 0 && (
          <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed border-2 border-border/60 bg-muted/10 mt-4 rounded-2xl animate-fade-in">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
              {searchQuery ? <Search size={22} /> : <Inbox size={22} />}
            </div>
            <h3 className="font-bold text-sm text-foreground mb-1">İşlem bulunamadı</h3>
            <p className="text-xs text-muted-foreground max-w-[240px] mb-4">
              {searchQuery 
                ? "Bu kriterlere uygun işlem bulunamadı. Lütfen filtrelerinizi veya arama teriminizi kontrol edin."
                : "Seçilen ayda herhangi bir işlem bulunmuyor."
              }
            </p>
            {!searchQuery && (
              <Link href="/">
                <Button size="sm" className="flex items-center gap-1">
                  <Plus size={14} />
                  Yeni İşlem Ekle
                </Button>
              </Link>
            )}
          </Card>
        )}

        {/* Transactions List Grouped by Date */}
        {!loading && transactions.length > 0 && (
          <div className="space-y-5 pt-2">
            {Object.entries(groupedTx).map(([dateGroup, items]) => (
              <div key={dateGroup} className="space-y-2 animate-fade-in">
                {/* Date Header */}
                <h3 className="text-xs font-semibold text-muted-foreground/80 pl-1">
                  {dateGroup}
                </h3>
                
                {/* Group Items */}
                <div className="space-y-2">
                  {items.map((tx) => {
                    // Decide which icon to show
                    let Icon = HelpCircle;
                    if (tx.type === "transfer") {
                      Icon = ArrowLeftRight;
                    } else if (tx.category && categoryIconMap[tx.category]) {
                      Icon = categoryIconMap[tx.category];
                    } else {
                      Icon = tx.type === "income" ? TrendingUp : TrendingDown;
                    }

                    // Styles based on type
                    const isIncome = tx.type === "income";
                    const isExpense = tx.type === "expense";

                    const isSelected = selectedTxIds.has(tx.id);

                    return (
                      <Card
                        key={tx.id}
                        className={cn(
                          "flex items-center gap-3 !p-3 border-border/40 hover:border-border transition-all duration-200 cursor-pointer select-none",
                          isSelected ? "border-primary/50 bg-primary/[0.02]" : ""
                        )}
                        onClick={() => handleSelectToggle(tx.id)}
                      >
                        {/* Checkbox Selector */}
                        <div className="flex items-center justify-center shrink-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by onClick on card
                            className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary/45 cursor-pointer"
                          />
                        </div>

                        {/* Left Icon Avatar */}
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all",
                            isIncome
                              ? "bg-emerald-500/10 text-emerald-500"
                              : isExpense
                                ? "bg-red-500/10 text-red-500"
                                : "bg-blue-500/10 text-blue-500"
                          )}
                        >
                          <Icon size={18} />
                        </div>

                        {/* Middle Text Info */}
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {tx.description || tx.category || (tx.type === "transfer" ? "Transfer" : "İşlem")}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            <span className="font-light">{tx.accountName}</span>
                            {tx.toAccountName && (
                              <>
                                <span className="mx-1 text-muted-foreground/50">→</span>
                                <span className="font-light">{tx.toAccountName}</span>
                              </>
                            )}
                            {tx.category && tx.description && (
                              <>
                                <span className="mx-1.5 text-muted-foreground/30">•</span>
                                <span className="text-[10px] rounded bg-muted px-1.5 py-0.5 text-muted-foreground font-medium">
                                  {tx.category}
                                </span>
                              </>
                            )}
                          </p>
                        </div>

                        {/* Right Amount */}
                        <div className="text-right shrink-0">
                          <p
                            className={cn(
                              "text-sm font-semibold",
                              isIncome
                                ? "text-emerald-500"
                                : isExpense
                                  ? "text-red-500"
                                  : "text-foreground/90"
                            )}
                          >
                            {isIncome ? "+" : isExpense ? "-" : ""}
                            {formatCurrency(tx.amount)}
                          </p>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Floating Bulk Actions Bar */}
        {selectedTxIds.size > 0 && (
          <div className="fixed bottom-20 left-4 right-4 z-50 flex flex-col gap-2.5 rounded-2xl border border-primary/25 bg-background/95 p-4 shadow-xl backdrop-blur-md animate-slide-up select-none">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">
                {selectedTxIds.size} işlem seçildi
              </span>
              <button
                onClick={() => setSelectedTxIds(new Set())}
                className="text-xs text-muted-foreground hover:text-foreground font-medium cursor-pointer"
              >
                Seçimi Temizle
              </button>
            </div>

            <div className="flex items-center gap-2 border-t border-border/40 pt-2.5">
              {/* Bulk Category selector */}
              <select
                value={bulkCategory}
                onChange={(e) => {
                  setBulkCategory(e.target.value);
                  handleBulkCategoryChange(e.target.value);
                }}
                disabled={bulkActionLoading}
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/45 cursor-pointer font-medium disabled:opacity-50"
              >
                <option value="">Kategori Değiştir...</option>
                {Array.from(new Set([
                  "Yemek", "Ulaşım", "Market", "Fatura", "Sağlık", "Eğlence", "Alışveriş", "Eğitim", "Maaş", "Freelance", "Yatırım", "Hediye", "Diğer",
                  ...categories.map(c => c.name)
                ])).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Bulk Delete Button */}
              <Button
                variant="danger"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkActionLoading}
                className="flex items-center gap-1 text-xs px-4"
              >
                Sil
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
