"use client";

import { useState, useEffect } from "react";
import { X, ArrowRightLeft, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/utils";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  color: string;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: "income" | "expense" | "transfer";
  accounts: Account[];
  onSuccess: () => void;
}

export function TransactionModal({
  isOpen,
  onClose,
  initialType = "expense",
  accounts,
  onSuccess,
}: TransactionModalProps) {
  const [type, setType] = useState<"income" | "expense" | "transfer">(initialType);
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Custom categories state (loaded to populate dropdown options)
  const [customCategories, setCustomCategories] = useState<any[]>([]);

  // Sync state with initialType when modal opens
  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setError("");
      setAmount("");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);

      if (accounts.length > 0) {
        setAccountId(accounts[0].id);
        const secondAcc = accounts.find((a) => a.id !== accounts[0].id);
        setToAccountId(secondAcc ? secondAcc.id : accounts[0].id);
      }

      // Fetch custom categories from Supabase
      fetch("/api/categories")
        .then((r) => r.json())
        .then((res) => {
          if (res.data) {
            setCustomCategories(res.data);
          }
        })
        .catch((err) => console.error("Error fetching categories:", err));
    }
  }, [isOpen, initialType, accounts]);

  // Sync category defaults when type changes or categories load
  useEffect(() => {
    if (type === "income") {
      setCategory(INCOME_CATEGORIES[0]);
    } else if (type === "expense") {
      setCategory(EXPENSE_CATEGORIES[0]);
    } else {
      setCategory(""); // Transfer has no category
    }
  }, [type, customCategories]);

  if (!isOpen) return null;

  const getCategoryOptions = () => {
    const staticList = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const optionsMap = new Map<string, string>();
    
    // Add defaults
    staticList.forEach((c) => optionsMap.set(c, c));
    
    // Add custom categories filtered by type
    customCategories
      .filter((c) => c.type === (type === "income" ? "income" : "expense"))
      .forEach((c) => optionsMap.set(c.name, c.name));

    return Array.from(optionsMap.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Lütfen geçerli bir tutar girin.");
      setLoading(false);
      return;
    }

    if (type === "transfer" && accountId === toAccountId) {
      setError("Aynı hesaba transfer yapamazsınız.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        type,
        accountId,
        amount: parsedAmount,
        description: description || undefined,
        category: type !== "transfer" ? category : undefined,
        date,
        toAccountId: type === "transfer" ? toAccountId : undefined,
      };

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "İşlem kaydedilemedi.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:items-center px-0 md:px-4">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-card p-6 shadow-2xl transition-all duration-300 animate-slide-up md:rounded-2xl border border-border">
        {/* Drag handle for mobile */}
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted md:hidden" />

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Yeni İşlem Ekle</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="mb-6 grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
              type === "expense"
                ? "bg-card text-red-500 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingDown size={14} />
            Gider
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
              type === "income"
                ? "bg-card text-emerald-500 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingUp size={14} />
            Gelir
          </button>
          <button
            type="button"
            onClick={() => setType("transfer")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
              type === "transfer"
                ? "bg-card text-blue-500 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowRightLeft size={14} />
            Transfer
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount input */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Tutar</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background pl-8 pr-3 py-3 text-lg font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                ₺
              </span>
            </div>
          </div>

          {/* Account selector(s) */}
          {type === "transfer" ? (
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Kaynak Hesap"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                options={accounts.map((a) => ({ value: a.id, label: a.name }))}
              />
              <Select
                label="Hedef Hesap"
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                options={accounts.map((a) => ({ value: a.id, label: a.name }))}
              />
            </div>
          ) : (
            <Select
              label="Hesap"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              options={accounts.map((a) => ({ value: a.id, label: a.name }))}
            />
          )}

          {/* Category selector */}
          {type !== "transfer" && (
            <Select
              label="Kategori"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={getCategoryOptions()}
            />
          )}

          {/* Optional Description */}
          <Input
            label="Açıklama"
            placeholder="Opsiyonel"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Date */}
          <Input
            label="Tarih"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          {/* Submit button */}
          <Button
            type="submit"
            size="lg"
            className="w-full mt-2"
            disabled={loading || accounts.length === 0}
          >
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </form>
      </div>
    </div>
  );
}
