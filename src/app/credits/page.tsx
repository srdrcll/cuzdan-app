"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Landmark } from "lucide-react";

interface Credit {
  id: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate: number;
  monthlyPayment: number;
  dueDate: string | null;
}

export default function CreditsPage() {
  const router = useRouter();
  const [credits, setCredits] = useState<Credit[]>([]);
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payAccountId, setPayAccountId] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    totalAmount: "",
    interestRate: "",
    monthlyPayment: "",
    dueDate: "",
  });

  function loadCredits() {
    fetch("/api/credits")
      .then((r) => r.json())
      .then((res) => setCredits(res.data || []));
  }

  useEffect(() => {
    loadCredits();
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((res) => {
        const accs = res.data || [];
        setAccounts(accs);
        if (accs.length > 0) setPayAccountId(accs[0].id);
      });
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        totalAmount: parseFloat(form.totalAmount),
        interestRate: parseFloat(form.interestRate) || 0,
        monthlyPayment: parseFloat(form.monthlyPayment) || 0,
        dueDate: form.dueDate || undefined,
      }),
    });

    if (res.ok) {
      setShowForm(false);
      setForm({ name: "", totalAmount: "", interestRate: "", monthlyPayment: "", dueDate: "" });
      loadCredits();
    }
    setLoading(false);
  }

  async function handlePay(creditId: string) {
    setLoading(true);
    const res = await fetch("/api/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "pay",
        id: creditId,
        amount: parseFloat(payAmount),
        accountId: payAccountId,
      }),
    });

    if (res.ok) {
      setPayingId(null);
      setPayAmount("");
      loadCredits();
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <>
      <Header title="Krediler" />
      <div className="space-y-4 px-4 py-4 animate-slide-up">
        {!showForm ? (
          <Button variant="secondary" className="w-full" onClick={() => setShowForm(true)}>
            <Plus size={16} className="mr-2" /> Yeni Kredi Ekle
          </Button>
        ) : (
          <Card>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Kredi Adı"
                placeholder="Örn: Konut Kredisi"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                label="Toplam Tutar"
                type="number"
                step="0.01"
                value={form.totalAmount}
                onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Faiz (%)"
                  type="number"
                  step="0.01"
                  value={form.interestRate}
                  onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
                />
                <Input
                  label="Aylık Taksit"
                  type="number"
                  step="0.01"
                  value={form.monthlyPayment}
                  onChange={(e) => setForm({ ...form, monthlyPayment: e.target.value })}
                />
              </div>
              <Input
                label="Son Ödeme Tarihi"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Kaydediliyor..." : "Kaydet"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  İptal
                </Button>
              </div>
            </form>
          </Card>
        )}

        {credits.length === 0 ? (
          <Card className="py-8 text-center">
            <Landmark size={32} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Henüz kredi kaydı yok</p>
          </Card>
        ) : (
          credits.map((credit) => {
            const progress =
              ((credit.totalAmount - credit.remainingAmount) / credit.totalAmount) * 100;

            return (
              <Card key={credit.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{credit.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Faiz: %{credit.interestRate} · Taksit:{" "}
                      {formatCurrency(credit.monthlyPayment)}
                    </p>
                    {credit.dueDate && (
                      <p className="text-xs text-muted-foreground">
                        Son ödeme: {formatDate(credit.dueDate)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {formatCurrency(credit.remainingAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      / {formatCurrency(credit.totalAmount)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {credit.remainingAmount > 0 && (
                  <div className="mt-3">
                    {payingId === credit.id ? (
                      <div className="space-y-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Ödeme tutarı"
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                        />
                        <Select
                          value={payAccountId}
                          onChange={(e) => setPayAccountId(e.target.value)}
                          options={accounts.map((a) => ({
                            value: a.id,
                            label: a.name,
                          }))}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handlePay(credit.id)}
                            disabled={loading || !payAmount}
                            className="flex-1"
                          >
                            Öde
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPayingId(null)}
                          >
                            İptal
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full"
                        onClick={() => setPayingId(credit.id)}
                      >
                        Ödeme Yap
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </>
  );
}
