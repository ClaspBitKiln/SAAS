import { NextRequest, NextResponse } from "next/server";
import { withX402, x402ResourceServer } from "@x402/next";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { auditPublicOffer, PublicFetchError } from "@/lib/audit";

export const runtime = "nodejs";
export const maxDuration = 15;
const MAX_REQUEST_BYTES = 4_096;

function jsonError(code: string, message: string, status: number) {
  return NextResponse.json({ service:"OfferProof", error:{ code, message } }, { status });
}

export async function handleOfferProof(request: NextRequest): Promise<NextResponse<any>> {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_REQUEST_BYTES) {
    return jsonError("REQUEST_TOO_LARGE", "Request body is limited to 4 KB.", 413);
  }
  let bodyText: string;
  try { bodyText = await request.text(); }
  catch { return jsonError("INVALID_BODY", "Could not read request body.", 400); }
  if (new TextEncoder().encode(bodyText).byteLength > MAX_REQUEST_BYTES) {
    return jsonError("REQUEST_TOO_LARGE", "Request body is limited to 4 KB.", 413);
  }
  let body: unknown;
  try { body = JSON.parse(bodyText); }
  catch { return jsonError("INVALID_JSON", "Send a JSON object with a url field.", 400); }
  const url = (body as {url?:unknown})?.url;
  if (typeof url !== "string" || !url.trim() || url.length > 2048) {
    return jsonError("INVALID_URL", "The url field must be a non-empty URL under 2,048 characters.", 400);
  }

  try {
    const report = await auditPublicOffer(url.trim());
    return NextResponse.json(report, {
      status: 200,
      headers: { "Cache-Control":"no-store", "X-Content-Type-Options":"nosniff" }
    });
  } catch (error) {
    if (error instanceof PublicFetchError) return jsonError(error.code, error.message, error.status);
    console.error("[OfferProof] Unexpected audit error", error);
    return jsonError("INTERNAL_ERROR", "The audit failed. No payment should be captured for an unsuccessful response.", 500);
  }
}

const payTo = process.env.X402_PAY_TO_ADDRESS || "";
const network = process.env.X402_NETWORK || "eip155:84532"; // Base Sepolia testnet by default.
const facilitatorUrl = process.env.X402_FACILITATOR_URL || "https://x402.org/facilitator";
export const PAYMENT_MODE = process.env.X402_ENABLED === "true" ? network : "disabled";
const x402Enabled = process.env.X402_ENABLED === "true" &&
  /^0x[a-fA-F0-9]{40}$/.test(payTo) &&
  ["eip155:84532", "eip155:8453"].includes(network) &&
  (network !== "eip155:8453" || Boolean(process.env.X402_FACILITATOR_URL));

const server = x402Enabled
  ? new x402ResourceServer(new HTTPFacilitatorClient({ url: facilitatorUrl }))
      .register("eip155:*", new ExactEvmScheme())
  : null;

const unconfiguredHandler = async (_request: NextRequest) => jsonError(
  "PAYMENTS_NOT_CONFIGURED",
  "OfferProof is not accepting requests yet. Configure X402_PAY_TO_ADDRESS, X402_NETWORK, X402_FACILITATOR_URL for mainnet, and X402_ENABLED=true. No payment has been taken.",
  503
);

export const POST = x402Enabled && server
  ? withX402(
      handleOfferProof,
      {
        accepts: [{
          scheme: "exact",
          price: process.env.X402_PRICE_USD || "$0.02",
          network,
          payTo
        }],
        description: "Verify public product-offer facts and JSON-LD consistency with evidence. No checkout or purchase is executed.",
        mimeType: "application/json"
      },
      server
    )
  : unconfiguredHandler;
