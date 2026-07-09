"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Wallet,
  Building2,
  CreditCard,
  X,
  Trash2,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/offline-db";
import {
  cn,
  formatCurrency,
  formatShortDate,
  TRANSACTION_TYPES,
  ACCOUNT_TYPES,
} from "@/lib/utils";

const iconMap = {
  Wallet,
  Building2,
  CreditCard,
};

interface AccountListProps {
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    balance: number;
    color: string;
    creditLimit?: number | null;
    statementDay?: number | null;
    dueDay?: number | null;
    minPaymentPct?: number | null;
  }>;
  onRefresh?: () => void;
}

export function AccountList({ accounts, onRefresh }: AccountListProps) {
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  // CC Debt Payment states
  const [showPayCC, setShowPayCC] = useState(false);
  const [payCCAmount, setPayCCAmount] = useState("");
  const [payCCSourceId, setPayCCSourceId] = useState("");
  const [payCCLoading, setPayCCLoading] = useState(false);

  useEffect(() => {
    setShowPayCC(false);
    setPayCCAmount("");
    setPayCCSourceId("");
  }, [selectedAccount]);

  const sourceAccounts = accounts.filter(a => a.type !== "credit_card");

  const handlePayCCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payCCSourceId || !payCCAmount || !selectedAccount) return;
    
    const parsedAmount = parseFloat(payCCAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Lütfen geçerli bir tutar girin.");
      return;
    }
    
    setPayCCLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "transfer",
          accountId: payCCSourceId,
          toAccountId: selectedAccount.id,
          amount: parsedAmount,
          description: `${selectedAccount.name} Kart Borcu Ödemesi`,
          category: "Transfer",
          date: new Date().toISOString().split("T")[0],
        }),
      });
      
      if (res.ok) {
        setShowPayCC(false);
        setPayCCAmount("");
        if (onRefresh) onRefresh();
        
        // Refresh selected account balance locally to avoid reload delay
        const updatedDestAcc = await db.accounts.get(selectedAccount.id);
        if (updatedDestAcc) {
          setSelectedAccount(updatedDestAcc);
        }
      } else {
        const data = await res.json();
        alert(data.error || "Ödeme işlemi sırasında bir hata oluştu.");
      }
    } catch (err) {
      console.error("Pay CC debt error:", err);
      alert("Ödeme işlemi sırasında bir hata oluştu.");
    } finally {
      setPayCCLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedAccount) {
      setTransactions([]);
      return;
    }
    
    async function loadTransactions() {
      const allTx = await db.transactions
        .filter(t => t.accountId === selectedAccount.id || t.toAccountId === selectedAccount.id)
        .toArray();
      
      allTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(allTx.slice(0, 10));
    }
    
    loadTransactions();
  }, [selectedAccount]);

  const handleDelete = async () => {
    if (!selectedAccount) return;
    
    const confirmDelete = window.confirm(
      `"${selectedAccount.name}" hesabını silmek istediğinize emin misiniz?\n\nUYARI: Bu hesaba ait tüm geçmiş işlemler de kalıcı olarak silinecektir!`
    );
    
    if (confirmDelete) {
      try {
        const res = await fetch(`/api/accounts?id=${selectedAccount.id}`, {
          method: "DELETE",
        });
        
        if (res.ok) {
          setSelectedAccount(null);
          if (onRefresh) onRefresh();
        } else {
          alert("Hesap silinirken bir hata oluştu.");
        }
      } catch (err) {
        console.error("Delete account error:", err);
        alert("Hesap silinirken bir hata oluştu.");
      }
    }
  };

  if (accounts.length === 0) {
    return (
      <Card>
        <p className="py-4 text-center text-sm text-muted-foreground">
          Henüz hesap eklenmemiş.{" "}
          <Link href="/accounts/new" className="text-primary underline">
            Hesap oluştur
          </Link>
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {accounts.map((account) => {
          const typeInfo = ACCOUNT_TYPES[account.type as keyof typeof ACCOUNT_TYPES] || { label: "Hesap", icon: "Wallet" };
          const Icon = iconMap[typeInfo.icon as keyof typeof iconMap] || Wallet;
          const isCredit = account.type === "credit_card";

          return (
            <Card 
              key={account.id} 
              className="flex items-center gap-3 !p-3 cursor-pointer hover:bg-muted/50 active:scale-[0.98] transition-all"
              onClick={() => setSelectedAccount(account)}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${account.color}20`, color: account.color }}
              >
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{account.name}</p>
                <p className="text-xs text-muted-foreground">{typeInfo.label}</p>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    isCredit && account.balance < 0 && "text-danger"
                  )}
                >
                  {isCredit
                    ? formatCurrency(Math.abs(account.balance))
                    : formatCurrency(account.balance)}
                </p>
                {isCredit && account.creditLimit && (
                  <p className="text-xs text-muted-foreground">
                    Limit: {formatCurrency(account.creditLimit)}
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Account Detail Modal */}
      {selectedAccount && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-2xl animate-scale-in max-h-[85vh] flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${selectedAccount.color}20`, color: selectedAccount.color }}
                >
                  {(() => {
                    const typeInfo = ACCOUNT_TYPES[selectedAccount.type as keyof typeof ACCOUNT_TYPES];
                    const Icon = iconMap[typeInfo.icon as keyof typeof iconMap];
                    return <Icon size={16} />;
                  })()}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm leading-none">{selectedAccount.name}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {ACCOUNT_TYPES[selectedAccount.type as keyof typeof ACCOUNT_TYPES]?.label || "Hesap"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAccount(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              
              {/* Balance Card */}
              <div className="rounded-2xl bg-muted/50 p-4 text-center">
                <p className="text-xs text-muted-foreground font-medium mb-1">Mevcut Bakiye</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(selectedAccount.balance)}
                </p>
              </div>

              {/* Credit Details */}
              {selectedAccount.type === "credit_card" && (
                <div className="rounded-2xl border border-border/60 p-3 space-y-2 text-xs">
                  <h4 className="font-bold text-muted-foreground uppercase text-[9px] tracking-wider mb-1">Kart Detayları</h4>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kredi Limiti:</span>
                    <span className="font-semibold">{formatCurrency(selectedAccount.creditLimit || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hesap Kesim Günü:</span>
                    <span className="font-semibold">Her ayın {selectedAccount.statementDay}. günü</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Son Ödeme Günü:</span>
                    <span className="font-semibold">Her ayın {selectedAccount.dueDay}. günü</span>
                  </div>
                  {selectedAccount.minPaymentPct && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Asgari Ödeme Oranı:</span>
                      <span className="font-semibold">%{selectedAccount.minPaymentPct}</span>
                    </div>
                  )}
                </div>
              )}

              {/* CC Debt Payment Section */}
              {selectedAccount.type === "credit_card" && (
                <div className="border-t border-border/50 pt-3">
                  {!showPayCC ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setShowPayCC(true);
                        if (sourceAccounts.length > 0) setPayCCSourceId(sourceAccounts[0].id);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 text-xs bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                    >
                      <CreditCard size={14} />
                      Kart Borcu Öde
                    </Button>
                  ) : (
                    <form onSubmit={handlePayCCSubmit} className="space-y-3 bg-muted/30 p-3 rounded-2xl border border-border/40">
                      <h4 className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Kart Borcu Öde</h4>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] text-muted-foreground font-medium uppercase">Ödeme Kaynağı Hesap</label>
                        <select
                          value={payCCSourceId}
                          onChange={(e) => setPayCCSourceId(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/45 font-medium"
                          required
                        >
                          {sourceAccounts.map(a => (
                            <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-muted-foreground font-medium uppercase">Tutar (₺)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="0.00"
                          value={payCCAmount}
                          onChange={(e) => setPayCCAmount(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/45 font-semibold"
                          required
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPayCC(false)}
                          className="text-[10px] h-7 px-2"
                        >
                          İptal
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={payCCLoading || sourceAccounts.length === 0}
                          className="text-[10px] h-7 px-3 bg-primary text-primary-foreground"
                        >
                          {payCCLoading ? "Ödeniyor..." : "Öde"}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Recent Transactions list */}
              <div className="space-y-2">
                <h4 className="font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Son İşlemler</h4>
                {transactions.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-4">Bu hesaba ait işlem bulunamadı.</p>
                ) : (
                  <div className="space-y-1.5">
                    {transactions.map((tx) => {
                      const typeInfo = TRANSACTION_TYPES[tx.type as keyof typeof TRANSACTION_TYPES] || { label: "İşlem", color: "text-primary" };
                      const isExpense = tx.type === "expense";
                      const isIncome = tx.type === "income";
                      
                      return (
                        <div key={tx.id} className="flex items-center justify-between rounded-xl bg-muted/30 p-2.5 text-xs">
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="font-semibold truncate text-foreground">
                              {tx.description || tx.category || typeInfo.label}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Calendar size={10} />
                              {formatShortDate(tx.date)}
                            </p>
                          </div>
                          <p className={cn("font-bold text-right shrink-0", 
                            isIncome ? "text-success" : isExpense ? "text-danger" : "text-primary"
                          )}>
                            {isIncome ? "+" : isExpense ? "-" : ""}
                            {formatCurrency(tx.amount)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-border pt-4 mt-4 shrink-0 flex gap-2">
              <Button 
                variant="danger" 
                size="sm"
                onClick={handleDelete}
                className="w-full flex items-center justify-center gap-1 text-xs"
              >
                <Trash2 size={14} />
                Hesabı Sil
              </Button>
            </div>

          </Card>
        </div>
      )}
    </>
  );
}

interface TransactionListProps {
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string | null;
    category: string | null;
    date: string;
    accountName: string;
    toAccountName?: string | null;
  }>;
}

export function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <Card>
        <p className="py-4 text-center text-sm text-muted-foreground">
          Henüz işlem yok
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const typeInfo = TRANSACTION_TYPES[tx.type as keyof typeof TRANSACTION_TYPES] || { label: "İşlem", color: "text-primary" };
        const Icon =
          tx.type === "income"
            ? ArrowDownLeft
            : tx.type === "expense"
              ? ArrowUpRight
              : ArrowLeftRight;

        return (
          <Card key={tx.id} className="flex items-center gap-3 !p-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl bg-muted",
                typeInfo.color || "text-primary"
              )}
            >
              <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">
                {tx.description || tx.category || typeInfo.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {tx.accountName}
                {tx.toAccountName && ` → ${tx.toAccountName}`}
                {" · "}
                {formatShortDate(tx.date)}
              </p>
            </div>
            <p className={cn("text-sm font-semibold", typeInfo.color)}>
              {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
              {formatCurrency(tx.amount)}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
