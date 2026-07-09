"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EXPENSE_CATEGORIES } from "@/lib/utils";

export default function ExpensePage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentCount, setInstallmentCount] = useState(6);
  const [form, setForm] = useState({
    accountId: "",
    amount: "",
    description: "",
    category: EXPENSE_CATEGORIES[0] as string,
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((res) => {
        const accs = res.data || [];
        setAccounts(accs);
        if (accs.length > 0) setForm((f) => ({ ...f, accountId: accs[0].id }));
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "expense",
        accountId: form.accountId,
        amount: parseFloat(form.amount),
        description: form.description,
        category: form.category,
        date: form.date,
        isInstallment,
        totalInstallments: installmentCount,
      }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <>
      <Header title="Gider Ekle" />
      <form onSubmit={handleSubmit} className="space-y-5 px-4 py-4 animate-slide-up">
        <Select
          label="Hesap"
          value={form.accountId}
          onChange={(e) => setForm({ ...form, accountId: e.target.value })}
          options={accounts.map((a) => ({ value: a.id, label: a.name }))}
        />

        <Input
          label="Tutar"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
        />

        <Select
          label="Kategori"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
        />

        <Input
          label="Açıklama"
          placeholder="Opsiyonel"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <Input
          label="Tarih"
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />

        {/* Taksit Seçeneği */}
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={isInstallment}
              onChange={(e) => setIsInstallment(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span>Taksitli Harcama</span>
          </label>

          {isInstallment && (
            <div className="space-y-3 animate-slide-up">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Taksit Sayısı</label>
                <select
                  value={installmentCount}
                  onChange={(e) => setInstallmentCount(parseInt(e.target.value))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value={2}>2 Taksit</option>
                  <option value={3}>3 Taksit</option>
                  <option value={4}>4 Taksit</option>
                  <option value={5}>5 Taksit</option>
                  <option value={6}>6 Taksit</option>
                  <option value={9}>9 Taksit</option>
                  <option value={12}>12 Taksit</option>
                </select>
              </div>

              {form.amount && parseFloat(form.amount) > 0 && (
                <div className="text-xs text-muted-foreground font-medium bg-muted/50 p-2.5 rounded-xl">
                  Aylık Ödeme: <span className="font-bold text-foreground">{installmentCount} ay boyunca {((parseFloat(form.amount) || 0) / installmentCount).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>
                </div>
              )}
            </div>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading || accounts.length === 0}>
          {loading ? "Kaydediliyor..." : "Gider Ekle"}
        </Button>
      </form>
    </>
  );
}
