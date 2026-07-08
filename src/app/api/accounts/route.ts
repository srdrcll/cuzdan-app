import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api";
import { createAccount, getAllAccounts, deleteAccount } from "@/lib/services";

export async function GET() {
  try {
    const accounts = await getAllAccounts();
    return jsonOk(accounts);
  } catch {
    return jsonError("Hesaplar yüklenemedi", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || !body.type) {
      return jsonError("Hesap adı ve türü gerekli");
    }
    const account = await createAccount(body);
    return jsonOk(account, 201);
  } catch {
    return jsonError("Hesap oluşturulamadı", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return jsonError("Hesap ID gerekli");
    await deleteAccount(id);
    return jsonOk({ success: true });
  } catch {
    return jsonError("Hesap silinemedi", 500);
  }
}
