"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Header } from "@/components/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SettingsModal } from "@/components/settings-modal";
import { db } from "@/lib/offline-db";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import {
  Download,
  Upload,
  Sparkles,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Moon,
  Sun,
  Laptop,
  Bell,
  Clock,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LocalNotifications } from "@capacitor/local-notifications";

interface Toast {
  type: "success" | "error";
  message: string;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const [profileName, setProfileName] = useState("Kullanıcı");
  const [profilePic, setProfilePic] = useState("");
  
  // Security Settings States
  const [appLockEnabled, setAppLockEnabled] = useState(false);
  const [appLockBiometric, setAppLockBiometric] = useState(false);
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [pinConfirmCode, setPinConfirmCode] = useState("");
  const [pinPromptError, setPinPromptError] = useState("");

  // Report Settings States
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("profile_name");
      const storedPic = localStorage.getItem("profile_pic");
      if (storedName) setProfileName(storedName);
      if (storedPic) setProfilePic(storedPic);
      setAppLockEnabled(localStorage.getItem("app_lock_enabled") === "true");
      setAppLockBiometric(localStorage.getItem("app_lock_biometric") === "true");
      setDailyReminderEnabled(localStorage.getItem("daily_reminder_enabled") === "true");
      setDailyReminderTime(localStorage.getItem("daily_reminder_time") || "20:00");

      // Initialize report date range
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const formatDateString = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };
      
      setReportStartDate(formatDateString(firstDay));
      setReportEndDate(formatDateString(now));
    }
  }, []);

  // Notifications Settings States
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(false);
  const [dailyReminderTime, setDailyReminderTime] = useState("20:00");

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleProfileNameChange = (name: string) => {
    setProfileName(name);
    localStorage.setItem("profile_name", name);
  };

  const handleProfilePicChange = (url: string) => {
    setProfilePic(url);
    localStorage.setItem("profile_pic", url);
  };

  const handleToggleAppLock = (enabled: boolean) => {
    if (enabled) {
      const storedPin = localStorage.getItem("app_lock_pin");
      if (!storedPin) {
        // Must set a PIN first!
        setPinCode("");
        setPinConfirmCode("");
        setPinPromptError("");
        setIsPinPromptOpen(true);
        return;
      }
      setAppLockEnabled(true);
      localStorage.setItem("app_lock_enabled", "true");
      showToast("success", "Uygulama kilidi aktifleşti.");
    } else {
      setAppLockEnabled(false);
      localStorage.setItem("app_lock_enabled", "false");
      showToast("success", "Uygulama kilidi devre dışı bırakıldı.");
    }
  };

  const handleToggleBiometric = (enabled: boolean) => {
    setAppLockBiometric(enabled);
    localStorage.setItem("app_lock_biometric", enabled ? "true" : "false");
    showToast("success", enabled ? "Biyometrik giriş aktifleştirildi." : "Biyometrik giriş kapatıldı.");
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinCode.length !== 4 || pinConfirmCode.length !== 4) {
      setPinPromptError("PIN kodu 4 haneli olmalıdır.");
      return;
    }
    if (!/^\d+$/.test(pinCode)) {
      setPinPromptError("PIN kodu sadece rakamlardan oluşmalıdır.");
      return;
    }
    if (pinCode !== pinConfirmCode) {
      setPinPromptError("Şifreler eşleşmiyor.");
      return;
    }

    localStorage.setItem("app_lock_pin", pinCode);
    localStorage.setItem("app_lock_enabled", "true");
    setAppLockEnabled(true);
    setIsPinPromptOpen(false);
    showToast("success", "PIN Kodu başarıyla kaydedildi.");
  };

  const scheduleDailyReminder = async (timeStr: string) => {
    try {
      const parts = timeStr.split(":");
      const hour = parseInt(parts[0], 10);
      const minute = parseInt(parts[1], 10);

      const perm = await LocalNotifications.requestPermissions();
      if (perm.display === "granted") {
        await LocalNotifications.cancel({ notifications: [{ id: 100 }] });
        await LocalNotifications.schedule({
          notifications: [
            {
              title: "Bütçe Takibi Hatırlatıcı",
              body: "Bugün harcamalarını kaydettin mi?",
              id: 100,
              schedule: {
                every: "day",
                on: {
                  hour,
                  minute,
                },
              },
            },
          ],
        });
      }
    } catch (err) {
      console.warn("LocalNotifications schedule error:", err);
    }
  };

  const handleToggleDailyReminder = async (enabled: boolean) => {
    setDailyReminderEnabled(enabled);
    localStorage.setItem("daily_reminder_enabled", enabled ? "true" : "false");
    
    if (enabled) {
      await scheduleDailyReminder(dailyReminderTime);
      showToast("success", "Günlük hatırlatıcı aktifleşti.");
    } else {
      try {
        await LocalNotifications.cancel({ notifications: [{ id: 100 }] });
      } catch (err) {
        console.warn("LocalNotifications cancel error:", err);
      }
      showToast("success", "Günlük hatırlatıcı kapatıldı.");
    }
  };

  const handleReminderTimeChange = async (timeStr: string) => {
    setDailyReminderTime(timeStr);
    localStorage.setItem("daily_reminder_time", timeStr);
    if (dailyReminderEnabled) {
      await scheduleDailyReminder(timeStr);
      showToast("success", `Hatırlatma saati ${timeStr} olarak güncellendi.`);
    }
  };

  const handleExportData = async () => {
    try {
      // 1. Gather all local database tables
      const backupData = {
        accounts: await db.accounts.toArray(),
        categories: await db.categories.toArray(),
        transactions: await db.transactions.toArray(),
        categoryBudgets: await db.categoryBudgets.toArray(),
        credits: await db.credits.toArray(),
        notifications: await db.notifications.toArray(),
      };
      
      const jsonString = JSON.stringify(backupData, null, 2);

      // 2. Try native Capacitor sharing first
      try {
        const writeResult = await Filesystem.writeFile({
          path: "budget_backup.json",
          data: jsonString,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });

        await Share.share({
          title: "Bütçe Takip Yedek Dosyası",
          text: "Bütçe Takip uygulamasından yedek verileriniz.",
          url: writeResult.uri,
          dialogTitle: "Yedeği Paylaş",
        });

        showToast("success", "Yedek dosyası başarıyla paylaşıldı.");
      } catch (capError) {
        // 3. Fallback: Download via Web Browser
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "budget_backup.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast("success", "Yedek dosyası cihazınıza indirildi.");
      }
    } catch (err: any) {
      showToast("error", err.message || "Veri dışa aktarılamadı.");
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        // Simple validation checks
        if (!data.accounts || !data.categories || !data.transactions) {
          throw new Error("Geçersiz yedek dosyası formatı. Dosya eksik veri içeriyor.");
        }

        // Clean and write atomically
        await db.transaction(
          "rw",
          [db.accounts, db.categories, db.transactions, db.categoryBudgets, db.credits, db.notifications],
          async () => {
            await db.accounts.clear();
            await db.categories.clear();
            await db.transactions.clear();
            await db.categoryBudgets.clear();
            await db.credits.clear();
            await db.notifications.clear();

            if (Array.isArray(data.accounts)) await db.accounts.bulkAdd(data.accounts);
            if (Array.isArray(data.categories)) await db.categories.bulkAdd(data.categories);
            
            if (Array.isArray(data.transactions)) {
              // Convert date strings back to javascript Date objects
              const txs = data.transactions.map((t: any) => ({
                ...t,
                date: new Date(t.date),
                createdAt: new Date(t.createdAt),
              }));
              await db.transactions.bulkAdd(txs);
            }
            
            if (Array.isArray(data.categoryBudgets)) {
              const budgets = data.categoryBudgets.map((b: any) => ({
                ...b,
                createdAt: new Date(b.createdAt),
              }));
              await db.categoryBudgets.bulkAdd(budgets);
            }
            
            if (Array.isArray(data.credits)) await db.credits.bulkAdd(data.credits);
            
            if (Array.isArray(data.notifications)) {
              const notifications = data.notifications.map((n: any) => ({
                ...n,
                createdAt: new Date(n.createdAt),
              }));
              await db.notifications.bulkAdd(notifications);
            }
          }
        );

        showToast("success", "Verileriniz başarıyla geri yüklendi!");
        // Reset file input value
        e.target.value = "";
      } catch (err: any) {
        showToast("error", err.message || "Yedek dosyası yüklenirken hata oluştu.");
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (
      confirm(
        "Tüm veritabanı kayıtlarınız, hesaplarınız ve bütçe hedefleriniz sıfırlanacaktır. Bu işlem geri alınamaz! Devam etmek istiyor musunuz?"
      )
    ) {
      localStorage.clear();
      if (typeof window !== "undefined") {
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (const registration of registrations) {
              registration.unregister();
            }
          });
        }
        if ("caches" in window) {
          caches.keys().then((keys) => {
            for (const key of keys) {
              caches.delete(key);
            }
          });
        }
      }
      db.transaction(
        "rw",
        [db.accounts, db.categories, db.transactions, db.categoryBudgets, db.credits, db.notifications],
        async () => {
          await db.accounts.clear();
          await db.categories.clear();
          await db.transactions.clear();
          await db.categoryBudgets.clear();
          await db.credits.clear();
          await db.notifications.clear();
        }
      ).then(() => {
        window.location.reload();
      });
    }
  };

  const generateReportData = async () => {
    if (!reportStartDate || !reportEndDate) return [];
    const start = new Date(reportStartDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(reportEndDate);
    end.setHours(23, 59, 59, 999);

    const txs = await db.transactions
      .where("date")
      .between(start, end, true, true)
      .toArray();

    // Sort by date descending
    txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const accs = await db.accounts.toArray();
    const accountMap = new Map(accs.map((a) => [a.id, a.name]));

    return txs.map((t) => {
      let typeLabel = "İşlem";
      if (t.type === "income") typeLabel = "Gelir";
      else if (t.type === "expense") typeLabel = "Gider";
      else if (t.type === "transfer") typeLabel = "Transfer";

      let accountLabel = accountMap.get(t.accountId) || "Bilinmeyen Hesap";
      if (t.type === "transfer" && t.toAccountId) {
        const toAccName = accountMap.get(t.toAccountId) || "Bilinmeyen Hesap";
        accountLabel = `${accountLabel} -> ${toAccName}`;
      }

      const txDate = new Date(t.date);
      const formattedDate = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}-${String(txDate.getDate()).padStart(2, "0")}`;

      return {
        Tarih: formattedDate,
        "İşlem Türü": typeLabel,
        Kategori: t.category || (t.type === "transfer" ? "Transfer" : "-"),
        Hesap: accountLabel,
        Tutar: t.amount,
        Açıklama: t.description || "",
      };
    });
  };

  const handleExportCSV = async () => {
    try {
      if (!reportStartDate || !reportEndDate) {
        showToast("error", "Lütfen tarih aralığı seçin.");
        return;
      }
      
      const reportData = await generateReportData();
      if (reportData.length === 0) {
        showToast("error", "Seçilen tarih aralığında işlem bulunamadı.");
        return;
      }

      const headers = ["Tarih", "İşlem Türü", "Kategori", "Hesap", "Tutar", "Açıklama"];
      const csvRows = [
        headers.join(","),
        ...reportData.map((row) =>
          [
            row.Tarih,
            row["İşlem Türü"],
            `"${row.Kategori.replace(/"/g, '""')}"`,
            `"${row.Hesap.replace(/"/g, '""')}"`,
            row.Tutar,
            `"${row.Açıklama.replace(/"/g, '""')}"`,
          ].join(",")
        ),
      ];
      const csvString = "\uFEFF" + csvRows.join("\n");

      const dateStr = reportStartDate.replace(/-/g, "") + "_" + reportEndDate.replace(/-/g, "");
      const fileName = `Finansal_Rapor_${dateStr}.csv`;

      try {
        const writeResult = await Filesystem.writeFile({
          path: fileName,
          data: csvString,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });

        await Share.share({
          title: "Finansal Rapor (CSV)",
          text: `${reportStartDate} - ${reportEndDate} tarihleri arası bütçe raporu.`,
          url: writeResult.uri,
          dialogTitle: "Raporu Paylaş",
        });

        showToast("success", "CSV Raporu başarıyla paylaşıldı.");
      } catch (capError) {
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast("success", "CSV Raporu cihazınıza indirildi.");
      }
    } catch (err: any) {
      showToast("error", err.message || "CSV raporu oluşturulamadı.");
    }
  };

  const handleExportExcel = async () => {
    try {
      if (!reportStartDate || !reportEndDate) {
        showToast("error", "Lütfen tarih aralığı seçin.");
        return;
      }
      
      const reportData = await generateReportData();
      if (reportData.length === 0) {
        showToast("error", "Seçilen tarih aralığında işlem bulunamadı.");
        return;
      }

      const XLSX = await import("xlsx");
      const worksheet = XLSX.utils.json_to_sheet(reportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Finansal Rapor");
      
      const excelBase64 = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "base64",
      });

      const dateStr = reportStartDate.replace(/-/g, "") + "_" + reportEndDate.replace(/-/g, "");
      const fileName = `Finansal_Rapor_${dateStr}.xlsx`;

      try {
        const writeResult = await Filesystem.writeFile({
          path: fileName,
          data: excelBase64,
          directory: Directory.Cache,
        });

        await Share.share({
          title: "Finansal Rapor (Excel)",
          text: `${reportStartDate} - ${reportEndDate} tarihleri arası bütçe raporu.`,
          url: writeResult.uri,
          dialogTitle: "Raporu Paylaş",
        });

        showToast("success", "Excel Raporu başarıyla paylaşıldı.");
      } catch (capError) {
        const raw = window.atob(excelBase64);
        const rawLength = raw.length;
        const array = new Uint8Array(new ArrayBuffer(rawLength));
        for (let i = 0; i < rawLength; i++) {
          array[i] = raw.charCodeAt(i);
        }
        
        const blob = new Blob([array], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast("success", "Excel Raporu cihazınıza indirildi.");
      }
    } catch (err: any) {
      showToast("error", err.message || "Excel raporu oluşturulamadı.");
    }
  };

  if (!mounted) return null;

  return (
    <>
      <Header title="Ayarlar" />
      <div className="space-y-5 px-4 py-4 animate-slide-up pb-24">
        
        {/* Profile Card */}
        <Card className="p-4 space-y-4 border-border/40">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Kullanıcı Bilgileri</h3>
          <div className="flex items-center gap-4">
            <div className="relative">
              {profilePic ? (
                <img
                  src={profilePic}
                  alt="Profil"
                  className="h-14 w-14 rounded-full object-cover border-2 border-primary/20"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold border-2 border-primary/20">
                  {profileName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={profileName}
                onChange={(e) => handleProfileNameChange(e.target.value)}
                placeholder="İsminiz..."
                className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary/45"
              />
              <input
                type="text"
                value={profilePic}
                onChange={(e) => handleProfilePicChange(e.target.value)}
                placeholder="Profil resmi URL..."
                className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-[10px] text-muted-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/45 font-light"
              />
            </div>
          </div>
        </Card>

        {/* Backups Card */}
        <Card className="p-4 space-y-3 border-border/40">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Veri Yedekleme</h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Verilerinizi cihazınıza yedekleyebilir veya başka bir cihaza aktarmak üzere yedeğinizi paylaşabilirsiniz.
          </p>
          
          <div className="grid grid-cols-2 gap-2 pt-1">
            {/* Export */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportData}
              className="flex items-center justify-center gap-1.5 text-xs cursor-pointer"
            >
              <Download size={14} />
              Dışa Aktar
            </Button>
            
            {/* Import */}
            <label className="flex items-center justify-center gap-1.5 rounded-xl border border-input bg-background hover:bg-accent hover:text-accent-foreground px-3 py-2 text-xs font-medium cursor-pointer shadow-sm transition-colors">
              <Upload size={14} />
              İçe Aktar
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>
        </Card>

        {/* Financial Reporting Card */}
        <Card className="p-4 space-y-3 border-border/40">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Finansal Raporlama</h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Belirli bir tarih aralığındaki tüm gelir, gider ve transfer işlemlerinizi CSV veya Excel formatında dışa aktarın.
          </p>
          
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="mb-1 block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Başlangıç</label>
              <input
                type="date"
                value={reportStartDate}
                onChange={(e) => setReportStartDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary/45"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Bitiş</label>
              <input
                type="date"
                value={reportEndDate}
                onChange={(e) => setReportEndDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary/45"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-1.5 text-xs cursor-pointer"
            >
              <FileSpreadsheet size={14} className="text-emerald-500" />
              CSV Raporu Al
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-1.5 text-xs cursor-pointer"
            >
              <FileSpreadsheet size={14} className="text-blue-500" />
              Excel Raporu Al
            </Button>
          </div>
        </Card>

        {/* Security Card */}
        <Card className="p-4 space-y-4 border-border/40">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Güvenlik</h3>
          
          {/* App Lock Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-foreground">Uygulama Kilidi</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">Açılışta kilit şifresi ister (Varsayılan PIN)</p>
            </div>
            <button
              onClick={() => handleToggleAppLock(!appLockEnabled)}
              className={cn(
                "relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                appLockEnabled ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
                  appLockEnabled ? "translate-x-4.5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {appLockEnabled && (
            <div className="space-y-4 border-t border-border/40 pt-3 animate-fade-in">
              {/* Biometrics Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Biyometrik Giriş</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Alternatif olarak Parmak izi / Yüz tanımayı aktif eder</p>
                </div>
                <button
                  onClick={() => handleToggleBiometric(!appLockBiometric)}
                  className={cn(
                    "relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    appLockBiometric ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
                      appLockBiometric ? "translate-x-4.5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* PIN Code change button */}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setPinCode("");
                  setPinConfirmCode("");
                  setPinPromptError("");
                  setIsPinPromptOpen(true);
                }}
                className="w-full flex items-center justify-center gap-1.5 text-xs cursor-pointer"
              >
                PIN Kodunu Değiştir
              </Button>
            </div>
          )}
        </Card>

        {/* Notifications Card */}
        <Card className="p-4 space-y-4 border-border/40">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Bildirimler</h3>

          {/* Daily Reminder Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-foreground">Günlük Hatırlatıcı</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">Harcamalarınızı kaydetmeniz için günlük hatırlatma gönderir</p>
            </div>
            <button
              onClick={() => handleToggleDailyReminder(!dailyReminderEnabled)}
              className={cn(
                "relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                dailyReminderEnabled ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
                  dailyReminderEnabled ? "translate-x-4.5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {dailyReminderEnabled && (
            <div className="flex items-center justify-between border-t border-border/40 pt-3 animate-fade-in">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Clock size={14} className="text-primary" />
                <span>Hatırlatma Saati</span>
              </div>
              <input
                type="time"
                value={dailyReminderTime}
                onChange={(e) => handleReminderTimeChange(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary/45"
              />
            </div>
          )}
        </Card>

        {/* Theme Settings Card */}
        <Card className="p-4 space-y-3.5 border-border/40">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Görünüm</h3>
          <div className="flex rounded-xl bg-muted p-1">
            <button
              onClick={() => setTheme("light")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer",
                theme === "light" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              <Sun size={13} />
              Açık
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer",
                theme === "dark" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              <Moon size={13} />
              Koyu
            </button>
            <button
              onClick={() => setTheme("system")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer",
                theme === "system" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              <Laptop size={13} />
              Sistem
            </button>
          </div>
        </Card>

        {/* Categories Settings Card */}
        <Card className="p-4 space-y-3.5 border-border/40">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Uygulama Yönetimi</h3>
          <div className="space-y-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCategoriesOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 text-xs cursor-pointer"
            >
              <Sparkles size={14} className="text-primary" />
              Kategorileri Yönet
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleResetData}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/5 cursor-pointer"
            >
              <RotateCcw size={14} />
              Tüm Verileri Sıfırla
            </Button>
          </div>
        </Card>

        {/* Categories Modal */}
        <SettingsModal isOpen={isCategoriesOpen} onClose={() => setIsCategoriesOpen(false)} />

        {/* PIN Setup/Edit Modal Overlay */}
        {isPinPromptOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
            <Card className="p-5 w-full max-w-sm border border-border/60 shadow-2xl space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-foreground">PIN Kodu Belirle</h3>
                <p className="text-xs text-muted-foreground">Uygulama kilidi için 4 haneli yeni bir PIN kodu girin</p>
              </div>

              {pinPromptError && (
                <div className="rounded-xl bg-red-500/10 p-2.5 text-xs text-red-500 flex items-center gap-1.5 font-medium">
                  <AlertCircle size={14} />
                  <span>{pinPromptError}</span>
                </div>
              )}

              <form onSubmit={handleSavePin} className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">PIN Şifresi</label>
                    <input
                      type="password"
                      maxLength={4}
                      pattern="[0-9]*"
                      inputMode="numeric"
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••"
                      required
                      className="w-full text-center tracking-[1em] text-lg rounded-xl border border-border bg-background px-3 py-2 font-bold focus:outline-none focus:ring-1 focus:ring-primary/45"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Şifreyi Onayla</label>
                    <input
                      type="password"
                      maxLength={4}
                      pattern="[0-9]*"
                      inputMode="numeric"
                      value={pinConfirmCode}
                      onChange={(e) => setPinConfirmCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••"
                      required
                      className="w-full text-center tracking-[1em] text-lg rounded-xl border border-border bg-background px-3 py-2 font-bold focus:outline-none focus:ring-1 focus:ring-primary/45"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsPinPromptOpen(false)}
                    className="flex-1 text-xs cursor-pointer"
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 text-xs cursor-pointer"
                  >
                    Kaydet
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Author Credit Footer */}
        <div className="text-center py-6 space-y-1">
          <p className="text-[10px] text-muted-foreground/60 font-medium">
            Created by <span className="font-bold text-foreground/80">Serdar Çil</span>
          </p>
          <a
            href="https://instagram.com/srdrcll"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] text-primary/75 hover:text-primary transition-colors font-semibold"
          >
            @srdrcll
          </a>
        </div>

        {/* Premium Toast Container */}
        {toast && (
          <div
            className={cn(
              "fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold animate-slide-up backdrop-blur-md",
              toast.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                : "bg-red-500/10 border-red-500/30 text-red-500"
            )}
          >
            {toast.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    </>
  );
}
