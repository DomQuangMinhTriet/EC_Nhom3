import Stripe from "stripe";
import test from "node:test";
import assert from "node:assert/strict";

test("stripe mock fetch", async (t) => {
  t.mock.method(globalThis, "fetch", async (url: string | URL) => {
    console.log("FETCH CALLED WITH:", url);
    return new Response(JSON.stringify({ id: "cs_test_123", url: "https://stripe.com/checkout" }), { status: 200 });
  });

  const stripe = new Stripe("sk_test_123", { apiVersion: "2026-08-26.dahlia" });
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [],
    mode: "payment",
    success_url: "http://example.com/success",
    cancel_url: "http://example.com/cancel",
  });

  assert.equal(session.id, "cs_test_123");
});
