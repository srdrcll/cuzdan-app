"use client";

import { useState, useEffect } from "react";
import { 
  db, 
  RecurringTransaction, 
  Category, 
  Account 
} from "@/lib/offline-db";
import { 
  Plus, 
  RefreshCw, 
  Trash2, 
  CalendarDays,
  ArrowRightLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { differenceInDays, startOfDay, format, addDays, addWeeks, addMonths, addYears } from "date-fns";
import { tr } from "date-fns/locale";

export default function SubscriptionsPage() {
  const [mounted, setMounted] = useState(false);
  const [subscriptions, setSubscriptions] = useState<RecurringTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly">("monthly");
  const [nextDate, setNextDate] = useState("");

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const subs = await db.recurringTransactions.toArray();
      const cats = await db.categories.toArray();
      const accs = await db.accounts.toArray();
      setSubscriptions(subs);
      setCategories(cats);
      setAccounts(accs);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !categoryId || !accountId || !nextDate) return;

    try {
      await db.recurringTransactions.add({
        id: uuidv4(),
        title,
        amount: parseFloat(amount),
        type,
        categoryId,
        accountId,
        frequency,
        nextDate: startOfDay(new Date(nextDate)),
        createdAt: new Date(),
      });
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error adding subscription:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await db.recurringTransactions.delete(id);
      fetchData();
    } catch (error) {
      console.error("Error deleting subscription:", error);
    }
  };

  const handlePayNow = async (sub: RecurringTransaction) => {
    const confirmPay = window.confirm(`"${sub.title}" işlemini şimdi ödemek ve sıradaki tarihi güncellemek istediğinize emin misiniz?`);
    if (!confirmPay) return;

    try {
      const category = sub.categoryId ? await db.categories.get(sub.categoryId) : null;
      const categoryName = category ? category.name : null;

      let description = sub.title;
      let nextCompleted = sub.completedInstallments || 0;
      const total = sub.totalInstallments || 0;
      let shouldDelete = false;

      if (total > 0) {
        nextCompleted += 1;
        description = `${sub.title} (Taksit ${nextCompleted}/${total})`;
        if (nextCompleted >= total) {
          shouldDelete = true;
        }
      }

      await db.transactions.add({
        id: uuidv4(),
        type: sub.type,
        amount: sub.amount,
        description,
        category: categoryName,
        accountId: sub.accountId,
        toAccountId: null,
        date: new Date(),
        createdAt: new Date(),
      });

      const account = await db.accounts.get(sub.accountId);
      if (account) {
        const newBalance = sub.type === "income" 
          ? account.balance + sub.amount 
          : account.balance - sub.amount;
        await db.accounts.update(sub.accountId, { balance: newBalance });
      }

      let nextDate = startOfDay(new Date(sub.nextDate));
      if (sub.frequency === "daily") {
        nextDate = addDays(nextDate, 1);
      } else if (sub.frequency === "weekly") {
        nextDate = addWeeks(nextDate, 1);
      } else if (sub.frequency === "biweekly") {
        nextDate = addWeeks(nextDate, 2);
      } else if (sub.frequency === "monthly") {
        nextDate = addMonths(nextDate, 1);
      } else if (sub.frequency === "quarterly") {
        nextDate = addMonths(nextDate, 3);
      } else if (sub.frequency === "yearly") {
        nextDate = addYears(nextDate, 1);
      }

      if (shouldDelete) {
        await db.recurringTransactions.delete(sub.id);
      } else {
        await db.recurringTransactions.update(sub.id, {
          nextDate,
          completedInstallments: nextCompleted
        });
      }

      alert("Ödeme işlemi başarıyla kaydedildi!");
      fetchData();
    } catch (error) {
      console.error("Pay now error:", error);
      alert("İşlem gerçekleştirilirken bir hata oluştu.");
    }
  };

  const resetForm = () => {
    setTitle("");
    setAmount("");
    setType("expense");
    setCategoryId("");
    setAccountId("");
    setFrequency("monthly");
    setNextDate("");
  };

  if (!mounted) return null;

  const today = startOfDay(new Date());

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case "daily": return "Günlük";
      case "weekly": return "Haftalık";
      case "biweekly": return "2 Haftada Bir";
      case "monthly": return "Aylık";
      case "quarterly": return "3 Ayda Bir";
      case "yearly": return "Yıllık";
      default: return freq;
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background p-4 pb-24">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Abonelikler</h1>
          <p className="text-sm text-muted-foreground">Sabit gelir ve giderleriniz</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <RefreshCw size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Henüz Kayıt Yok</h3>
            <p className="text-sm text-muted-foreground">
              Düzenli işlemlerinizi ekleyerek takibi otomatikleştirin.
            </p>
          </div>
        ) : (
          subscriptions.map((sub) => {
            const daysRemaining = differenceInDays(startOfDay(new Date(sub.nextDate)), today);
            const isLate = daysRemaining < 0;
            const isToday = daysRemaining === 0;
            const category = categories.find((c) => c.id === sub.categoryId);
            
            return (
              <div
                key={sub.id}
                className="group relative flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div 
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold shadow-inner ${
                    sub.type === 'expense' ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                  }`}
                >
                  {getInitials(sub.title)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground truncate">{sub.title}</h4>
                    <span className={`font-bold ${sub.type === 'expense' ? 'text-red-500' : 'text-emerald-500'}`}>
                      {sub.type === "expense" ? "-" : "+"}₺{sub.amount.toLocaleString("tr-TR")}
                    </span>
                  </div>
                  
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded-md">
                      <ArrowRightLeft size={10} />
                      {getFrequencyLabel(sub.frequency)}
                    </span>
                    {sub.totalInstallments && (
                      <span className="flex items-center gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md font-semibold">
                        Taksit: {sub.completedInstallments}/{sub.totalInstallments}
                      </span>
                    )}
                    <span className="truncate">{category?.name || "Kategori Yok"}</span>
                  </div>

                  {sub.totalInstallments && (
                    <div className="mt-2.5 text-[10px] text-amber-600 dark:text-amber-400 font-medium bg-amber-500/5 border border-amber-500/10 p-2 rounded-xl flex items-center justify-between">
                      <span>Toplam Tutar: ₺{(sub.amount * sub.totalInstallments).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                      <span>Kalan Borç: ₺{(sub.amount * (sub.totalInstallments - (sub.completedInstallments || 0))).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  
                  <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border/40 pt-2">
                    <div className="flex items-center gap-1 text-xs">
                      <CalendarDays size={12} className={isLate ? "text-red-500" : isToday ? "text-amber-500" : "text-primary"} />
                      <span className={`font-medium ${isLate ? "text-red-500" : isToday ? "text-amber-500" : "text-primary"}`}>
                        {isLate ? `${Math.abs(daysRemaining)} gün gecikti` : isToday ? "Bugün" : `${daysRemaining} gün kaldı`}
                      </span>
                      <span className="text-muted-foreground ml-1 text-[10px]">
                        ({format(new Date(sub.nextDate), "d MMM", { locale: tr })})
                      </span>
                    </div>

                    <button
                      onClick={() => handlePayNow(sub)}
                      className="flex items-center gap-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold transition-all cursor-pointer select-none"
                    >
                      <CheckCircle size={10} />
                      Şimdi Öde
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(sub.id)}
                  className="absolute -right-2 -top-2 hidden rounded-full bg-destructive p-2 text-destructive-foreground shadow-md transition-all group-hover:block active:scale-95 md:-right-3 md:-top-3"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-bold text-foreground">Yeni Abonelik / Sabit İşlem</h2>
            
            <form onSubmit={handleAdd} className="space-y-4">
              
              {/* Type Selection */}
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setType("expense")}
                  className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${
                    type === "expense"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  <ArrowDownCircle size={16} className={type === "expense" ? "text-red-500" : ""} />
                  Gider
                </button>
                <button
                  type="button"
                  onClick={() => setType("income")}
                  className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${
                    type === "income"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  <ArrowUpCircle size={16} className={type === "income" ? "text-emerald-500" : ""} />
                  Gelir
                </button>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Başlık / Kurum Adı
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Netflix, Kira, Maaş vb."
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Tutar (₺)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Kategori
                  </label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Seçiniz</option>
                    {categories
                      .filter((c) => c.type === type)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Hesap
                  </label>
                  <select
                    required
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Seçiniz</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Tekrar Sıklığı
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="daily">Günlük</option>
                    <option value="weekly">Haftalık</option>
                    <option value="biweekly">2 Haftada Bir</option>
                    <option value="monthly">Aylık</option>
                    <option value="quarterly">3 Ayda Bir</option>
                    <option value="yearly">Yıllık</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    İlk/Sonraki Tarih
                  </label>
                  <input
                    type="date"
                    required
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="flex-1 rounded-xl bg-muted py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/80 active:scale-95"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform active:scale-95 hover:bg-primary/90"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
