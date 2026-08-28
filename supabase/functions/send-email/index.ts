// Supabase Edge Function: send-email
//
// Called server-to-server by the backend (backend/src/modules/notification/
// notification.service.ts, sendEmailWithSupabase) using the Supabase
// service role key as bearer auth — never invoked directly from the browser.
//
// Required secrets (set with `supabase secrets set`, not committed here):
//   RESEND_API_KEY  - API key from resend.com
//   EMAIL_FROM      - e.g. "EC Voucher <notifications@your-domain.com>"
//
// Contract expected by the backend caller:
//   Request body:  { "email": string, "title": string, "body": string }
//   Success (200): { "message": "Email sent successfully" }
//   Failure:       any non-2xx status; body is parsed but only status matters.

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: { email?: unknown; title?: unknown; body?: unknown };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { email, title, body } = payload;
  if (
    typeof email !== "string" ||
    typeof title !== "string" ||
    typeof body !== "string" ||
    !email ||
    !title ||
    !body
  ) {
    return new Response(
      JSON.stringify({ error: "email, title, and body are required strings" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const EMAIL_FROM = Deno.env.get("EMAIL_FROM");

  if (!RESEND_API_KEY || !EMAIL_FROM) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY / EMAIL_FROM is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [email],
      subject: title,
      html: `<p>${body.replace(/\n/g, "<br/>")}</p>`,
    }),
  });

  if (!resendResponse.ok) {
    const detail = await resendResponse.text();
    return new Response(
      JSON.stringify({ error: "Resend API call failed", detail }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ message: "Email sent successfully" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
