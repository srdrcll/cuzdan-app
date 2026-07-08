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
  const [form, setForm] = useState({
    name: "",
    type: "cash" as "cash" | "bank" | "credit_card",
    balance: "",
    creditLimit: "",
    color: ACCOUNT_COLORS[0],
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

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
        color: form.color,
      }),
    });

    if (res.ok) {
      router.push("/accounts");
      router.refresh();
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
          <Input
            label="Kredi Limiti"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={form.creditLimit}
            onChange={(e) => setForm({ ...form, creditLimit: e.target.value })}
          />
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
      </form>
    </>
  );
}
