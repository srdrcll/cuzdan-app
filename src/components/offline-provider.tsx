"use client";

import { useEffect, useState } from "react";
import { seedDatabase } from "@/lib/offline-db";
import { handleOfflineRequest } from "@/lib/offline-services";

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const originalFetch = window.fetch;
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : (input instanceof URL ? input.href : input.url);
        
        // Match relative or absolute /api/... requests
        if (url.startsWith("/api/") || url.includes("/api/")) {
          try {
            const responseData = await handleOfflineRequest(url, init);
            return new Response(JSON.stringify({ data: responseData }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          } catch (err: any) {
            console.error("Offline interceptor error for URL:", url, err);
            return new Response(JSON.stringify({ error: err.message || "Internal offline error" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }
        }
        
        return originalFetch(input, init);
      };

      // Seed offline DB and then render
      seedDatabase().then(() => {
        setInitialized(true);
      });
    } else {
      setInitialized(true);
    }
  }, []);

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <p className="text-sm font-semibold text-foreground">Cüzdan</p>
          <p className="text-xs text-muted-foreground animate-pulse">Veritabanı hazırlanıyor...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
