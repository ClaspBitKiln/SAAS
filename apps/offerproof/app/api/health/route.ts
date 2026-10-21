import { NextResponse } from "next/server";
import { PAYMENT_MODE } from "@/lib/payment-status";

export const runtime = "nodejs";
export async function GET() {
  const enabled = process.env.X402_ENABLED === "true" && PAYMENT_MODE !== "disabled";
  return NextResponse.json({
    service: "OfferProof",
    status: enabled ? "ready" : "setup_required",
    paymentsEnabled: enabled,
    paymentMode: PAYMENT_MODE,
    pricePerSuccessfulRequest: process.env.X402_PRICE_USD || "$0.02",
    note: enabled ? "The payment gate is configured; this response does not verify a live settlement." : "No paid requests are accepted until payment configuration is valid."
  }, { headers: { "Cache-Control": "no-store" } });
}
