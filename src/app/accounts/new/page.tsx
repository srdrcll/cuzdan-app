"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ACCOUNT_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function NewAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    type: "cash" as "cash" | "bank" | "credit_card",
    balance: "",
    creditLimit: "",
    statementDay: "15",
    dueDay: "25",
    minPaymentPct: "40",
    color: ACCOUNT_COLORS[0] as string,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        type: form.type,
        balance: parseFloat(form.balance) || 0,
        creditLimit:
          form.type === "credit_card"
            ? parseFloat(form.creditLimit) || undefined
            : undefined,
        statementDay:
          form.type === "credit_card"
            ? parseInt(form.statementDay) || undefined
            : undefined,
        dueDay:
          form.type === "credit_card"
            ? parseInt(form.dueDay) || undefined
            : undefined,
        minPaymentPct:
          form.type === "credit_card"
            ? parseFloat(form.minPaymentPct) || undefined
            : undefined,
        color: form.color,
      }),
    });

    if (res.ok) {
      router.push("/accounts");
      router.refresh();
    } else {
      const body = await res.json();
      setError(body.error || "Hesap oluşturulamadı");
    }
    setLoading(false);
  }

  return (
    <>
      <Header title="Yeni Hesap" />
      <form onSubmit={handleSubmit} className="space-y-5 px-4 py-4 animate-slide-up">
        <Input
          label="Hesap Adı"
          placeholder="Örn: Ziraat Bankası"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <Select
          label="Hesap Türü"
          value={form.type}
          onChange={(e) =>
            setForm({ ...form, type: e.target.value as typeof form.type })
          }
          options={[
            { value: "cash", label: "Nakit" },
            { value: "bank", label: "Banka Hesabı" },
            { value: "credit_card", label: "Kredi Kartı" },
          ]}
        />

        <Input
          label={form.type === "credit_card" ? "Mevcut Borç" : "Başlangıç Bakiyesi"}
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={form.balance}
          onChange={(e) => setForm({ ...form, balance: e.target.value })}
        />

        {form.type === "credit_card" && (
          <>
            <Input
              label="Kredi Limiti"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={form.creditLimit}
              onChange={(e) => setForm({ ...form, creditLimit: e.target.value })}
              required
            />
            <div className="grid grid-cols-3 gap-2">
              <Input
                label="Hesap Kesim Günü"
                type="number"
                min="1"
                max="31"
                placeholder="15"
                value={form.statementDay}
                onChange={(e) => setForm({ ...form, statementDay: e.target.value })}
                required
              />
              <Input
                label="Son Ödeme Günü"
                type="number"
                min="1"
                max="31"
                placeholder="25"
                value={form.dueDay}
                onChange={(e) => setForm({ ...form, dueDay: e.target.value })}
                required
              />
              <Input
                label="Asgari Ödeme Oranı (%)"
                type="number"
                min="0"
                max="100"
                placeholder="40"
                value={form.minPaymentPct}
                onChange={(e) => setForm({ ...form, minPaymentPct: e.target.value })}
                required
              />
            </div>
          </>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Renk</label>
          <div className="flex flex-wrap gap-2">
            {ACCOUNT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setForm({ ...form, color })}
                className={cn(
                  "h-8 w-8 rounded-full transition-transform",
                  form.color === color && "ring-2 ring-offset-2 ring-primary scale-110"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Oluşturuluyor..." : "Hesap Oluştur"}
        </Button>
        {error && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500">
            {error}
          </p>
        )}
      </form>
    </>
  );
}
