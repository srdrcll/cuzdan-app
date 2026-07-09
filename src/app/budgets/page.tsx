"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Target,
  Plus,
  Trash2,
  AlertCircle,
  TrendingDown,
  Info,
} from "lucide-react";
import { cn, formatCurrency, EXPENSE_CATEGORIES } from "@/lib/utils";

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Period States
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Form States
  const [isAdding, setIsAdding] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const monthYearString = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/budgets?month_year=${monthYearString}`);
      const body = await res.json();
      if (body.data) {
        setBudgets(body.data);
      }
    } catch (err) {
      console.error("Error loading budgets:", err);
    } finally {
      setLoading(false);
    }
  }, [monthYearString]);

  // Fetch budgets and custom categories
  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  useEffect(() => {
    // Fetch custom categories
    fetch("/api/categories")
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          setCategories(res.data);
        }
      })
      .catch((err) => console.error("Error loading categories:", err));
  }, []);

  // Combine static and custom expense categories for the dropdown
  const categoryOptions = useMemo(() => {
    const optionsMap = new Map<string, string>();
    
    // Add default static expense categories
    EXPENSE_CATEGORIES.forEach((c) => optionsMap.set(c, c));
    
    // Add custom expense categories
    categories
      .filter((c) => c.type === "expense")
      .forEach((c) => optionsMap.set(c.name, c.name));

    // Exclude categories that already have a budget in the selected month
    budgets.forEach((b) => {
      optionsMap.delete(b.categoryName);
    });

    return Array.from(optionsMap.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [categories, budgets]);

  // Set default category name when dropdown options change
  useEffect(() => {
    if (categoryOptions.length > 0) {
      setCategoryName(categoryOptions[0].value);
    } else {
      setCategoryName("");
    }
  }, [categoryOptions]);

  async function handleAddBudget(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryName || !limitAmount) return;
    
    const amount = parseFloat(limitAmount);
    if (isNaN(amount) || amount <= 0) {
      setError("Lütfen geçerli bir limit tutarı girin.");
      return;
    }

    setFormLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryName,
          limitAmount: amount,
          monthYear: monthYearString,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Bütçe oluşturulamadı.");
      }

      setSuccess("Bütçe hedefi başarıyla oluşturuldu.");
      setLimitAmount("");
      setIsAdding(false);
      fetchBudgets();
    } catch (err: any) {
      setError(err.message || "Bütçe eklenirken hata oluştu.");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDeleteBudget(id: string) {
    if (!confirm("Bu bütçe hedefini silmek istediğinizden emin misiniz?")) return;
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/budgets?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Bütçe silinemedi.");
      }

      setSuccess("Bütçe hedefi silindi.");
      fetchBudgets();
    } catch (err: any) {
      setError(err.message || "Bütçe silinirken hata oluştu.");
    }
  }

  return (
    <>
      <Header title="Bütçe Hedefleri" />
      <div className="space-y-5 px-4 py-4 animate-slide-up pb-24">
        
        {/* Period Selector & Add Button */}
        <div className="flex items-center justify-between gap-2 bg-muted/40 border border-border/40 p-2 py-1.5 px-3 rounded-2xl">
          <div className="flex gap-1.5">
            {/* Month Selector */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/45 cursor-pointer font-semibold"
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
              className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/45 cursor-pointer font-semibold"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <Button
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1 text-xs !py-1.5"
            disabled={categoryOptions.length === 0 && !isAdding}
          >
            {isAdding ? "İptal" : "+ Yeni Hedef"}
          </Button>
        </div>

        {/* Success/Error Alerts */}
        {error && (
          <div className="rounded-xl bg-red-500/10 p-3 text-xs text-red-500 flex items-center gap-1.5">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-500">
            {success}
          </div>
        )}

        {/* Add Budget Form Card */}
        {isAdding && (
          <Card className="p-4 border border-primary/20 bg-primary/5 animate-slide-up space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              {new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(new Date(selectedYear, selectedMonth - 1))} İçin Hedef Koy
            </h3>
            <form onSubmit={handleAddBudget} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Select
                  label="Kategori"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  options={categoryOptions}
                  className="!py-2"
                />
                <Input
                  label="Aylık Limit (₺)"
                  type="number"
                  placeholder="0.00"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  required
                  className="!py-2"
                />
              </div>
              <Button type="submit" size="sm" className="w-full flex items-center justify-center gap-1" disabled={formLoading}>
                <Plus size={14} />
                {formLoading ? "Ekleniyor..." : "Hedef Ekle"}
              </Button>
            </form>
          </Card>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 bg-card/60 animate-pulse border-border/40 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-24 rounded bg-muted" />
                  <div className="h-4 w-12 rounded bg-muted" />
                </div>
                <div className="h-3.5 w-full rounded bg-muted" />
                <div className="flex justify-between">
                  <div className="h-3 w-28 rounded bg-muted/70" />
                  <div className="h-3 w-16 rounded bg-muted/70" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State Screen */}
        {!loading && budgets.length === 0 && (
          <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed border-2 border-border/60 bg-muted/10 mt-4 rounded-2xl animate-fade-in">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
              <Target size={24} />
            </div>
            <h3 className="font-bold text-sm text-foreground mb-1">Bütçe Hedefi Yok</h3>
            <p className="text-xs text-muted-foreground max-w-[240px]">
              Seçilen dönem ({new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(new Date(selectedYear, selectedMonth - 1))}) için bütçe hedefi tanımlanmamış.
            </p>
          </Card>
        )}

        {/* Budgets List with Progress Visuals */}
        {!loading && budgets.length > 0 && (
          <div className="space-y-3.5">
            {budgets.map((b) => {
              const limit = b.limitAmount;
              const spent = b.spentAmount;
              const ratio = Math.min(100, limit > 0 ? (spent / limit) * 100 : 0);
              const remaining = Math.max(0, limit - spent);
              const isOver = spent > limit;

              // Color & Visual effects logic
              let progressColor = "bg-emerald-500";
              let badgeText = `${ratio.toFixed(0)}% Dolu`;
              let cardShadowClass = "border-border/40";
              let barGlowClass = "";
              let alertPanel = null;
              
              if (spent >= limit) {
                progressColor = "bg-red-500";
                badgeText = "Limit Aşıldı!";
                cardShadowClass = "shadow-lg shadow-red-500/5 border-red-500/35 bg-red-500/[0.01]";
                barGlowClass = "shadow-[0_0_10px_rgba(239,68,68,0.65)]";
                alertPanel = (
                  <div className="mt-3 flex items-center gap-1.5 bg-red-500/10 text-red-500 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold border border-red-500/15 select-none animate-slide-up">
                    <AlertCircle size={12} className="shrink-0" />
                    <span>Harcama limitini aştınız! Lütfen giderlerinizi kontrol edin.</span>
                  </div>
                );
              } else if (ratio >= 80) {
                progressColor = "bg-amber-500";
                badgeText = `${ratio.toFixed(0)}% Limit Yaklaştı`;
                cardShadowClass = "shadow-md shadow-amber-500/5 border-amber-500/30 bg-amber-500/[0.005]";
                barGlowClass = "shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse";
                alertPanel = (
                  <div className="mt-3 flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold border border-amber-500/15 select-none animate-slide-up">
                    <Info size={12} className="shrink-0" />
                    <span>Bütçe limitine çok yaklaştınız! Kontrollü harcama önerilir.</span>
                  </div>
                );
              }

              return (
                <Card key={b.id} className={cn("p-4 hover:border-border transition-all duration-300 relative group", cardShadowClass)}>
                  {/* Category Name & Action Button */}
                  <div className="flex justify-between items-start mb-2.5">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{b.categoryName}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Aylık Harcama Limiti</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 select-none", 
                        spent >= limit 
                          ? "bg-red-500/10 text-red-500" 
                          : ratio >= 80 
                            ? "bg-amber-500/10 text-amber-500" 
                            : "bg-emerald-500/10 text-emerald-500"
                      )}>
                        {badgeText}
                      </span>
                      
                      <button
                        onClick={() => handleDeleteBudget(b.id)}
                        className="text-muted-foreground hover:text-red-500 p-1 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer"
                        title="Hedefi Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Clean Horizontal Progress Bar (İş Bankası Style) */}
                  <div className="space-y-2">
                    <div className="h-3 w-full overflow-hidden rounded-full bg-muted relative">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", progressColor, barGlowClass)}
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                    
                    {/* Bottom Status Labels */}
                    <div className="flex justify-between text-[11px] font-medium pt-0.5">
                      <div className="text-muted-foreground flex gap-1 items-center">
                        <TrendingDown size={12} className="text-muted-foreground/60" />
                        <span>{formatCurrency(spent)} harcandı</span>
                      </div>
                      <div className="text-foreground/90">
                        {isOver ? (
                          <span className="text-red-500 font-bold">
                            {formatCurrency(spent - limit)} aşıldı
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            {formatCurrency(remaining)} kaldı
                          </span>
                        )}
                        <span className="mx-1 text-muted-foreground/40">/</span>
                        <span className="text-muted-foreground font-light">{formatCurrency(limit)} limit</span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Warning/Info Panels */}
                  {alertPanel}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
