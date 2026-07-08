import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api";
import {
  createIncome,
  createExpense,
  createTransfer,
  getAllTransactions,
} from "@/lib/services";
import { checkCreditCardLimits } from "@/lib/services";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const transactions = await getAllTransactions(
      limit ? parseInt(limit) : undefined
    );
    return jsonOk(transactions);
  } catch {
    return jsonError("İşlemler yüklenemedi", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let result;

    switch (body.type) {
      case "income":
        result = await createIncome(body);
        break;
      case "expense":
        result = await createExpense(body);
        await checkCreditCardLimits();
        break;
      case "transfer":
        result = await createTransfer({
          fromAccountId: body.fromAccountId,
          toAccountId: body.toAccountId,
          amount: body.amount,
          description: body.description,
          date: body.date ? new Date(body.date) : undefined,
        });
        break;
      default:
        return jsonError("Geçersiz işlem türü");
    }

    return jsonOk(result, 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : "İşlem oluşturulamadı";
    return jsonError(message, 500);
  }
}
