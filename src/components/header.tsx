"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Bell } from "lucide-react";

interface HeaderProps {
  title: string;
  showAdd?: boolean;
  addHref?: string;
}

export function Header({ title, showAdd, addHref = "/transactions/new" }: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          const count = res.data.filter((n: any) => !n.read).length;
          setUnreadCount(count);
        }
      })
      .catch((err) => console.error("Error loading notifications:", err));
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg safe-top">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <h1 className="text-lg font-bold tracking-tight">{title}</h1>
        <div className="flex items-center gap-2">
          {mounted ? (
            /* Notifications Link */
            <Link
              href="/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Bildirimler"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>
          ) : (
            <div className="h-9 w-9 rounded-xl bg-muted/40 animate-pulse" />
          )}

          {showAdd && mounted && (
            <Link
              href={addHref}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus size={18} />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
