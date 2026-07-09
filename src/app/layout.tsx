import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { BottomNav } from "@/components/bottom-nav";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { OfflineProvider } from "@/components/offline-provider";
import { BiometricGuard } from "@/components/biometric-guard";
import { RecurringProcessor } from "@/components/recurring-processor";
import { SplashScreen } from "@/components/splash-screen";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cüzdan",
  description: "Kişisel bütçe takip uygulaması",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cüzdan",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-dvh antialiased">
        <ThemeProvider>
          <SplashScreen />
          <OfflineProvider>
            <BiometricGuard>
              <main className="mx-auto min-h-dvh max-w-lg pb-20">{children}</main>
              <BottomNav />
              <ServiceWorkerRegister />
              <RecurringProcessor />
            </BiometricGuard>
          </OfflineProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
