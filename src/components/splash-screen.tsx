"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const shown = sessionStorage.getItem("cuzdan-splash-shown");
      if (shown === "true") {
        return; // Keep mounted as false to skip splash entirely
      }
      
      // First visit in session: mount and show
      setMounted(true);
      sessionStorage.setItem("cuzdan-splash-shown", "true");
      
      // Start fade out animation after 1600ms
      const fadeTimer = setTimeout(() => {
        setVisible(false);
      }, 1600);

      // Unmount from DOM after transition completes (duration-500)
      const unmountTimer = setTimeout(() => {
        setMounted(false);
      }, 2100);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(unmountTimer);
      };
    }
  }, []);

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#09090b] transition-all duration-500 ease-in-out select-none",
        visible ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
      )}
    >
      <div className="flex flex-col items-center space-y-6 text-center animate-scale-in">
        {/* Softened Logo Container */}
        <div className="relative flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
          <img
            src="/icons/icon-512.png"
            alt="Cüzdan Logo"
            className="h-20 w-20 relative z-10 transition-transform duration-700 hover:scale-105 rounded-[22px] border border-white/10 shadow-xl"
          />
        </div>
        
        {/* App Title & Subtitle */}
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-violet-400 to-indigo-500 bg-clip-text text-transparent">
            Cüzdan
          </h1>
          <p className="text-[11px] font-semibold text-muted-foreground/60 tracking-wider uppercase">
            Kişisel Finans Asistanınız
          </p>
        </div>

        {/* Custom Progress Bar */}
        <div className="w-32 h-[3px] rounded-full bg-muted/10 overflow-hidden relative">
          <div className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full absolute left-0 top-0 animate-splash-progress" />
        </div>
      </div>
    </div>
  );
}
