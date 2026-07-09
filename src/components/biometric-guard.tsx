"use client";

import { useEffect, useState, useCallback } from "react";
import { NativeBiometric } from "capacitor-native-biometric";
import { App } from "@capacitor/app";
import { Fingerprint, Delete, ShieldAlert } from "lucide-react";

export function BiometricGuard({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // PIN states
  const [inputPin, setInputPin] = useState("");
  const [shake, setShake] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [isBrowser, setIsBrowser] = useState(true);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleError = (event: ErrorEvent) => {
        setRuntimeError(`Hata: ${event.message}\nKonum: ${event.filename}:${event.lineno}`);
      };
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        setRuntimeError(`Sözleşme Hatası: ${event.reason?.message || event.reason}`);
      };
      window.addEventListener("error", handleError);
      window.addEventListener("unhandledrejection", handleUnhandledRejection);
      return () => {
        window.removeEventListener("error", handleError);
        window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      };
    }
  }, []);

  // Check if lock is enabled
  const isLockEnabled = useCallback(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("app_lock_enabled") === "true";
  }, []);

  // Check if biometric is enabled
  const isBiometricEnabled = useCallback(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("app_lock_biometric") === "true";
  }, []);

  const triggerBiometricAuth = useCallback(async () => {
    if (!isLockEnabled() || !isBiometricEnabled()) return;

    try {
      const result = await NativeBiometric.isAvailable();
      setIsBrowser(false);

      if (result.isAvailable) {
        try {
          await NativeBiometric.verifyIdentity({
            reason: "Uygulamaya güvenli erişim sağlamak için kimliğinizi doğrulayın.",
            title: "Biyometrik Kilit",
            subtitle: "Kimlik Doğrulama",
            description: "Lütfen parmak izi veya yüz tanıma sensörünü kullanın.",
          });
          setLocked(false);
          setInputPin("");
          setErrorText("");
        } catch (authErr) {
          console.error("Biometric verification failed", authErr);
        }
      }
    } catch (err) {
      setIsBrowser(true);
    }
  }, [isLockEnabled, isBiometricEnabled]);

  const triggerAuthFlow = useCallback(async () => {
    if (!isLockEnabled()) {
      setLocked(false);
      return;
    }

    setLocked(true);
    setInputPin("");
    setErrorText("");

    // Attempt biometric automatically if enabled
    if (isBiometricEnabled()) {
      triggerBiometricAuth();
    }
  }, [isLockEnabled, isBiometricEnabled, triggerBiometricAuth]);

  useEffect(() => {
    setMounted(true);
    triggerAuthFlow();

    if (typeof window !== "undefined") {
      let activeListener: any = null;
      try {
        activeListener = App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) {
            triggerAuthFlow();
          }
        });
      } catch (e) {
        // Not supported in browser
      }

      return () => {
        if (activeListener) {
          activeListener.then((h: any) => h.remove());
        }
      };
    }
  }, [triggerAuthFlow]);

  // Handle PIN button click
  const handleKeyPress = (num: string) => {
    if (inputPin.length >= 4) return;
    setErrorText("");
    
    const newPin = inputPin + num;
    setInputPin(newPin);

    if (newPin.length === 4) {
      const storedPin = localStorage.getItem("app_lock_pin") || "1234";
      if (newPin === storedPin) {
        // Correct PIN
        setLocked(false);
        setInputPin("");
        setErrorText("");
      } else {
        // Incorrect PIN
        setShake(true);
        setErrorText("Hatalı PIN Kodu!");
        setTimeout(() => {
          setShake(false);
          setInputPin("");
        }, 300);
      }
    }
  };

  const handleDelete = () => {
    if (inputPin.length === 0) return;
    setInputPin(inputPin.slice(0, -1));
    setErrorText("");
  };

  if (!mounted) return null;

  if (locked) {
    const dots = [0, 1, 2, 3];
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-background p-8 select-none animate-fade-in pb-16">
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-8px); }
            40%, 80% { transform: translateX(8px); }
          }
        `}</style>

        {/* Top Header */}
        <div className="flex flex-col items-center text-center space-y-2 mt-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Fingerprint size={28} />
          </div>
          <h2 className="text-base font-bold text-foreground">Giriş Şifresi</h2>
          <p className="text-xs text-muted-foreground">Devam etmek için 4 haneli PIN kodunuzu girin</p>
        </div>

        {/* Visual Dots */}
        <div className="flex flex-col items-center space-y-4">
          <div
            className="flex gap-4"
            style={shake ? { animation: "shake 0.3s ease-in-out" } : {}}
          >
            {dots.map((index) => {
              const isActive = inputPin.length > index;
              return (
                <div
                  key={index}
                  className={`h-3.5 w-3.5 rounded-full border-2 transition-all duration-150 ${
                    errorText
                      ? "bg-red-500 border-red-500"
                      : isActive
                        ? "bg-primary border-primary scale-110"
                        : "border-muted-foreground/30 bg-transparent"
                  }`}
                />
              );
            })}
          </div>
          {errorText && (
            <p className="text-[10px] font-semibold text-red-500 flex items-center gap-1">
              <ShieldAlert size={12} />
              <span>{errorText}</span>
            </p>
          )}
          
          {runtimeError && (
            <div className="w-full max-w-[280px] p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-mono whitespace-pre-wrap text-left shrink-0">
              {runtimeError}
            </div>
          )}
        </div>

        {/* Keypad */}
        <div className="w-full max-w-[280px] space-y-4">
          <div className="grid grid-cols-3 justify-items-center gap-y-4">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                onClick={() => handleKeyPress(num)}
                className="h-16 w-16 text-xl font-medium rounded-full bg-muted/40 hover:bg-muted/70 text-foreground transition-all duration-150 active:scale-90 flex items-center justify-center cursor-pointer"
              >
                {num}
              </button>
            ))}

            {/* Bottom Row */}
            {/* Biometric Trigger */}
            <button
              onClick={triggerBiometricAuth}
              disabled={!isBiometricEnabled()}
              className={`h-16 w-16 rounded-full flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer ${
                isBiometricEnabled()
                  ? "text-primary bg-primary/10 hover:bg-primary/20"
                  : "text-muted-foreground/20 bg-transparent cursor-not-allowed"
              }`}
            >
              <Fingerprint size={24} />
            </button>

            {/* 0 Key */}
            <button
              onClick={() => handleKeyPress("0")}
              className="h-16 w-16 text-xl font-medium rounded-full bg-muted/40 hover:bg-muted/70 text-foreground transition-all duration-150 active:scale-90 flex items-center justify-center cursor-pointer"
            >
              0
            </button>

            {/* Delete/Backspace */}
            <button
              onClick={handleDelete}
              disabled={inputPin.length === 0}
              className={`h-16 w-16 rounded-full flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer ${
                inputPin.length > 0
                  ? "text-foreground hover:bg-muted/70 bg-muted/20"
                  : "text-muted-foreground/30 bg-transparent cursor-not-allowed"
              }`}
            >
              <Delete size={22} />
            </button>
          </div>

          {/* Browser dev bypass simulation */}
          {isBrowser && (
            <div className="pt-2">
              <button
                onClick={() => setLocked(false)}
                className="w-full py-1.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-[10px] font-semibold transition-colors cursor-pointer"
              >
                Simüle Et: Giriş İzni Ver
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
