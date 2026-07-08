"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { AccountList } from "@/components/account-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((res) => setAccounts(res.data || []));
  }, []);

  return (
    <>
      <Header title="Hesaplarım" showAdd addHref="/accounts/new" />
      <div className="space-y-4 px-4 py-4 animate-slide-up">
        <AccountList accounts={accounts} />
        <Link href="/accounts/new">
          <Button variant="secondary" className="w-full">
            <Plus size={16} className="mr-2" /> Yeni Hesap Ekle
          </Button>
        </Link>
      </div>
    </>
  );
}
