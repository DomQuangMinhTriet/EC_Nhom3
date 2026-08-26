import { NextRequest, NextResponse } from "next/server";

const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  if (!orderId || !uuidPattern.test(orderId)) {
    return NextResponse.json({ error: "Thiếu hoặc sai orderId." }, { status: 400 });
  }

  // This proxy holds a privileged, ownership-blind API key (the backend's PUT
  // /api/orders/:id has no ownership check of its own — only the API key gate).
  // Verify the caller's own bearer token actually owns this order via the
  // ownership-checked customer endpoint before forwarding the privileged call,
  // otherwise anyone with any non-empty Authorization header could complete
  // (and generate real voucher codes for) a stranger's order.
  const ownershipCheck = await fetch(`${backendUrl}/api/orders/${orderId}`, {
    headers: { Authorization: authorization },
  });

  if (!ownershipCheck.ok) {
    const errorBody: unknown = await ownershipCheck.json().catch(() => undefined);
    return NextResponse.json(errorBody ?? { error: "Không thể xác minh đơn hàng." }, { status: ownershipCheck.status });
  }

  const response = await fetch(`${backendUrl}/api/orders/${orderId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "ec-voucher-api-key": apiKey },
    body: JSON.stringify(payload),
  });
  const body: unknown = await response.json().catch(() => undefined);

  return NextResponse.json(body, { status: response.status });
}
