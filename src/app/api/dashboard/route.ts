import { jsonOk, jsonError } from "@/lib/api";
import { getDashboardData } from "@/lib/services";

export async function GET() {
  try {
    const data = await getDashboardData();
    return jsonOk(data);
  } catch {
    return jsonError("Dashboard verileri yüklenemedi", 500);
  }
}
