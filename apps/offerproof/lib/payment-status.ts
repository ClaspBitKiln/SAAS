const payTo = process.env.X402_PAY_TO_ADDRESS || "";
const network = process.env.X402_NETWORK || "eip155:84532";
const enabled = process.env.X402_ENABLED === "true" && /^0x[a-fA-F0-9]{40}$/.test(payTo) &&
  ["eip155:84532", "eip155:8453"].includes(network) &&
  (network !== "eip155:8453" || Boolean(process.env.X402_FACILITATOR_URL));

export const PAYMENT_MODE = enabled ? network : "disabled";
