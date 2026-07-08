"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

interface HeaderProps {
  title: string;
  showAdd?: boolean;
  addHref?: string;
}

export function Header({ title, showAdd, addHref = "/transactions/new" }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg safe-top">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {showAdd && (
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
