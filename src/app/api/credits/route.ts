import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api";
import { createCredit, getAllCredits, payCredit } from "@/lib/services";

export async function GET() {
  try {
    const credits = await getAllCredits();
    return jsonOk(credits);
  } catch {
    return jsonError("Krediler yüklenemedi", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === "pay") {
      const result = await payCredit(body.id, body.amount, body.accountId);
      return jsonOk(result);
    }

    if (!body.name || !body.totalAmount) {
      return jsonError("Kredi adı ve tutarı gerekli");
    }

    const credit = await createCredit({
      ...body,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    });
    return jsonOk(credit, 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Kredi oluşturulamadı";
    return jsonError(message, 500);
  }
}
