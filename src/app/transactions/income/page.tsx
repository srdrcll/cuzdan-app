"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { INCOME_CATEGORIES } from "@/lib/utils";

export default function IncomePage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    accountId: "",
    amount: "",
    description: "",
    category: INCOME_CATEGORIES[0],
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
        type: "income",
        accountId: form.accountId,
        amount: parseFloat(form.amount),
        description: form.description,
        category: form.category,
        date: form.date,
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
      <Header title="Gelir Ekle" />
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
          options={INCOME_CATEGORIES.map((c) => ({ value: c, label: c }))}
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

        <Button type="submit" size="lg" className="w-full" disabled={loading || accounts.length === 0}>
          {loading ? "Kaydediliyor..." : "Gelir Ekle"}
        </Button>
      </form>
    </>
  );
}
