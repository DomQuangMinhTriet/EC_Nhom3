import { NextRequest, NextResponse } from "next/server";

const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json({ error: "Bạn cần đăng nhập để tiếp tục." }, { status: 401 });
  }

  const apiKey = process.env.EC_VOUCHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Thiếu cấu hình EC_VOUCHER_API_KEY trên server." }, { status: 500 });
  }

  const { orderId, ...payload } = (await request.json().catch(() => ({}))) as { orderId?: string };
  if (!orderId) {
    return NextResponse.json({ error: "Thiếu orderId." }, { status: 400 });
  }

  const response = await fetch(`${backendUrl}/api/orders/${orderId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "ec-voucher-api-key": apiKey },
    body: JSON.stringify(payload),
  });
  const body: unknown = await response.json().catch(() => undefined);

  return NextResponse.json(body, { status: response.status });
}
