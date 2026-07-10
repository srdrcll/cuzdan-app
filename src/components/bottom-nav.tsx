"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Landmark,
  Settings,
  Download,
  RotateCcw,
  Sparkles,
  Target,
  Repeat,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsModal } from "@/components/settings-modal";

export function BottomNav() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Enriched Profile states
  const [userName, setUserName] = useState("Kullanıcı");
  const [userPic, setUserPic] = useState("");

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("profile_name");
      const storedPic = localStorage.getItem("profile_pic");
      if (storedName) setUserName(storedName);
      if (storedPic) setUserPic(storedPic);
    }
  }, []);

  useEffect(() => {
    if (isProfileMenuOpen && typeof window !== "undefined") {
      const storedName = localStorage.getItem("profile_name");
      const storedPic = localStorage.getItem("profile_pic");
      if (storedName) setUserName(storedName);
      if (storedPic) setUserPic(storedPic);
    }
  }, [isProfileMenuOpen]);

  // Handle outside clicks to close the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  if (!mounted) return null;

  const navItems = [
    { href: "/", label: "Ana Sayfa", icon: LayoutDashboard },
    { href: "/accounts", label: "Hesaplar", icon: Wallet },
    { href: "/transactions", label: "İşlemler", icon: ArrowLeftRight },
    { href: "/credits", label: "Krediler", icon: Landmark },
    { href: "/subscriptions", label: "Abonelikler", icon: Repeat },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/80 backdrop-blur-lg safe-bottom">
        <div ref={menuRef} className="mx-auto flex max-w-lg items-center justify-around px-2 py-2 relative">
          {/* Navigation Links */}
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-1 xs:px-2 sm:px-3 py-1 text-[9px] xs:text-[10px] sm:text-xs transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className="sm:w-5 sm:h-5" />
                <span className="font-semibold">{label}</span>
              </Link>
            );
          })}

          {/* Profil Button */}
          <button
            onClick={() => {
              setIsProfileMenuOpen(!isProfileMenuOpen);
            }}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-xl px-1 xs:px-2 sm:px-3 py-1 text-[9px] xs:text-[10px] sm:text-xs transition-colors cursor-pointer text-muted-foreground hover:text-foreground",
              isProfileMenuOpen && "text-primary"
            )}
            aria-label="Profil menüsü"
          >
            {userPic ? (
              <div className={cn(
                "h-[18px] w-[18px] sm:h-5 sm:w-5 rounded-full overflow-hidden border transition-colors",
                isProfileMenuOpen ? "border-primary" : "border-border"
              )}>
                <img src={userPic} alt="P" className="h-full w-full object-cover" />
              </div>
            ) : (
              <User size={18} strokeWidth={isProfileMenuOpen ? 2.5 : 2} className="sm:w-5 sm:h-5" />
            )}
            <span className="font-semibold">Profil</span>
          </button>
 
          {/* Enriched Profile Popover */}
          {isProfileMenuOpen && (
            <div className="absolute bottom-16 right-4 w-64 rounded-2xl border border-border bg-card p-4 shadow-2xl animate-slide-up backdrop-blur-md bg-card/95 flex flex-col gap-3">
              
              {/* User Header Section */}
              <div className="flex items-center gap-3 border-b border-border/50 pb-3">
                <div className="h-10 w-10 rounded-full overflow-hidden border border-primary/20 shrink-0 bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center">
                  {userPic ? (
                    <img src={userPic} alt="P" className="h-full w-full object-cover" />
                  ) : (
                    <svg viewBox="0 0 100 100" className="h-full w-full object-cover">
                      <circle cx="50" cy="40" r="18" fill="white" opacity="0.9" />
                      <path d="M22,80 C22,65 32,58 50,58 C68,58 78,65 78,80" fill="white" opacity="0.9" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-xs text-foreground truncate">{userName}</h4>
                  <p className="text-[10px] text-muted-foreground truncate">Kullanıcı Profili</p>
                </div>
              </div>

              {/* Action Menus */}
              <div className="space-y-1 text-xs text-left">
                {/* Hedefler */}
                <Link
                  href="/budgets"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 font-medium text-foreground hover:bg-muted transition-colors cursor-pointer text-left"
                >
                  <Target size={15} className="text-primary" />
                  <span>Hedefler</span>
                </Link>
                {/* Ayarlar */}
                <Link
                  href="/settings"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 font-medium text-foreground hover:bg-muted transition-colors cursor-pointer text-left"
                >
                  <Settings size={15} className="text-muted-foreground" />
                  <span>Ayarlar</span>
                </Link>
              </div>

              {/* Appearance / Theme Selector */}
              <div className="border-t border-border/50 pt-2.5">
                <p className="text-[9px] text-muted-foreground font-semibold mb-1.5 uppercase tracking-wider">
                  Görünüm Teması
                </p>
                <div className="grid grid-cols-3 gap-1 bg-muted p-0.5 rounded-lg text-[10px]">
                  <button
                    onClick={() => setTheme("light")}
                    className={cn(
                      "py-1 rounded font-medium cursor-pointer transition-all text-center",
                      theme === "light" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Aydınlık
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={cn(
                      "py-1 rounded font-medium cursor-pointer transition-all text-center",
                      theme === "dark" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Karanlık
                  </button>
                  <button
                    onClick={() => setTheme("system")}
                    className={cn(
                      "py-1 rounded font-medium cursor-pointer transition-all text-center",
                      theme === "system" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Sistem
                  </button>
                </div>
              </div>

              {/* Footer / Build Version */}
              <div className="text-center text-[9px] text-muted-foreground/60 border-t border-border/40 pt-2 space-y-0.5">
                <div>Cüzdan v1.2.0</div>
                <div className="text-[8px] text-muted-foreground/40 font-light">
                  Created by Serdar Çil
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
