"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { TransactionList } from "@/components/account-list";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, ArrowLeftRight } from "lucide-react";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetch("/api/transactions")
      .then((r) => r.json())
      .then((res) => setTransactions(res.data || []));
  }, []);

  return (
    <>
      <Header title="İşlemler" />
      <div className="space-y-4 px-4 py-4 animate-slide-up">
        <div className="grid grid-cols-3 gap-2">
          <Link href="/transactions/income">
            <Button variant="secondary" className="w-full flex-col gap-1 !h-auto !py-3">
              <TrendingUp size={18} className="text-emerald-500" />
              <span className="text-xs">Gelir</span>
            </Button>
          </Link>
          <Link href="/transactions/expense">
            <Button variant="secondary" className="w-full flex-col gap-1 !h-auto !py-3">
              <TrendingDown size={18} className="text-red-500" />
              <span className="text-xs">Gider</span>
            </Button>
          </Link>
          <Link href="/transactions/transfer">
            <Button variant="secondary" className="w-full flex-col gap-1 !h-auto !py-3">
              <ArrowLeftRight size={18} className="text-blue-500" />
              <span className="text-xs">Transfer</span>
            </Button>
          </Link>
        </div>

        <TransactionList transactions={transactions} />
      </div>
    </>
  );
}
