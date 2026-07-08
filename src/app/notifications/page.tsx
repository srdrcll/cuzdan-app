"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import { Bell, CheckCheck, AlertTriangle, Info, CheckCircle } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

const typeIcons = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  payment_due: Bell,
};

const typeColors = {
  info: "text-blue-500",
  warning: "text-warning",
  success: "text-emerald-500",
  payment_due: "text-primary",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [permission, setPermission] = useState<string>("default");

  function loadNotifications() {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((res) => setNotifications(res.data || []));
  }

  useEffect(() => {
    loadNotifications();
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  async function requestPermission() {
    if ("Notification" in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    loadNotifications();
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadNotifications();
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <Header title="Bildirimler" />
      <div className="space-y-4 px-4 py-4 animate-slide-up">
        {permission !== "granted" && (
          <Card className="flex items-center justify-between !p-3">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-primary" />
              <p className="text-sm">Push bildirimlerini etkinleştir</p>
            </div>
            <Button size="sm" onClick={requestPermission}>
              Etkinleştir
            </Button>
          </Card>
        )}

        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead} className="w-full">
            <CheckCheck size={16} className="mr-2" />
            Tümünü okundu işaretle ({unreadCount})
          </Button>
        )}

        {notifications.length === 0 ? (
          <Card className="py-8 text-center">
            <Bell size={32} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Bildirim yok</p>
          </Card>
        ) : (
          notifications.map((n) => {
            const Icon = typeIcons[n.type as keyof typeof typeIcons] || Info;
            const color = typeColors[n.type as keyof typeof typeColors] || "text-muted-foreground";

            return (
              <Card
                key={n.id}
                className={cn(
                  "flex gap-3 !p-3 cursor-pointer transition-colors",
                  !n.read && "border-primary/30 bg-primary/5"
                )}
                onClick={() => !n.read && markRead(n.id)}
              >
                <div className={cn("mt-0.5", color)}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(n.createdAt)}
                  </p>
                </div>
                {!n.read && (
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </Card>
            );
          })
        )}
      </div>
    </>
  );
}
