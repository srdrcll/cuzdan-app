"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function TransferPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((res) => {
        const accs = res.data || [];
        setAccounts(accs);
        if (accs.length >= 2) {
          setForm((f) => ({
            ...f,
            fromAccountId: accs[0].id,
            toAccountId: accs[1].id,
          }));
        } else if (accs.length === 1) {
          setForm((f) => ({ ...f, fromAccountId: accs[0].id }));
        }
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "transfer",
        fromAccountId: form.fromAccountId,
        toAccountId: form.toAccountId,
        amount: parseFloat(form.amount),
        description: form.description,
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
      <Header title="Transfer" />
      <form onSubmit={handleSubmit} className="space-y-5 px-4 py-4 animate-slide-up">
        <Select
          label="Gönderen Hesap"
          value={form.fromAccountId}
          onChange={(e) => setForm({ ...form, fromAccountId: e.target.value })}
          options={accounts.map((a) => ({ value: a.id, label: a.name }))}
        />

        <Select
          label="Alıcı Hesap"
          value={form.toAccountId}
          onChange={(e) => setForm({ ...form, toAccountId: e.target.value })}
          options={accounts
            .filter((a) => a.id !== form.fromAccountId)
            .map((a) => ({ value: a.id, label: a.name }))}
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

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={loading || accounts.length < 2}
        >
          {loading ? "Transfer yapılıyor..." : "Transfer Yap"}
        </Button>
      </form>
    </>
  );
}
