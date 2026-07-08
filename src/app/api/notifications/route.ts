import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/services";

export async function GET() {
  try {
    const notifications = await getNotifications();
    return jsonOk(notifications);
  } catch {
    return jsonError("Bildirimler yüklenemedi", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.all) {
      await markAllNotificationsRead();
    } else if (body.id) {
      await markNotificationRead(body.id);
    }
    return jsonOk({ success: true });
  } catch {
    return jsonError("Bildirim güncellenemedi", 500);
  }
}
