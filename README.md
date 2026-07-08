# Budget Tracker

Modern, minimal kişisel bütçe takip uygulaması. PWA destekli, mobil uyumlu, dark mode.

## Özellikler

- **Hesap yönetimi** — Nakit, banka ve kredi kartı hesapları
- **Gelir / Gider** — Kategorili işlem kaydı
- **Transfer** — Hesaplar arası para transferi
- **Kredi takibi** — Kredi borcu, taksit ve ödeme takibi
- **Dashboard** — Toplam bakiye, aylık özet
- **Grafikler** — Aylık gelir/gider ve harcama dağılımı
- **Bildirimler** — Kredi kartı limiti, ödeme hatırlatmaları
- **Dark Mode** — Sistem teması veya manuel geçiş
- **PWA** — Ana ekrana eklenebilir, offline destek

## Kurulum

```bash
cd ~/Projects/budget-tracker
npm install
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini açın.

## Teknolojiler

- **Next.js 15** — App Router, Server Components
- **TypeScript** — Tip güvenliği
- **Tailwind CSS 4** — Modern styling
- **SQLite + Drizzle ORM** — Yerel veritabanı
- **Recharts** — Grafikler
- **next-themes** — Dark mode

## Proje Yapısı

```
src/
├── app/                  # Sayfalar ve API route'ları
│   ├── api/              # REST API endpoints
│   ├── accounts/         # Hesap yönetimi
│   ├── transactions/     # Gelir, gider, transfer
│   ├── credits/          # Kredi takibi
│   └── notifications/    # Bildirimler
├── components/           # UI bileşenleri
└── lib/                  # DB, servisler, yardımcılar
```

## PWA Kurulumu

Mobil cihazda tarayıcı menüsünden "Ana Ekrana Ekle" seçeneğini kullanın.

## Veritabanı

SQLite veritabanı `data/budget.db` dosyasında saklanır. Migration'lar otomatik çalışır.
