import crypto from "crypto";

const PAYTECH_API_URL = "https://paytech.sn/api";
const PAYTECH_API_KEY = process.env.PAYTECH_API_KEY!;
const PAYTECH_API_SECRET = process.env.PAYTECH_API_SECRET!;

interface InitializePaymentParams {
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  metadata?: Record<string, string>;
  returnUrl: string;
  cancelUrl: string;
  ipnUrl: string;
  refCommand: string;
}

interface PaytechPaymentResponse {
  success: number;
  token: string;
  redirect_url: string;
  redirectUrl: string;
}

interface PaytechStatusResponse {
  success: number;
  status?: string;
  [key: string]: unknown;
}

export async function initializePayment(
  params: InitializePaymentParams
): Promise<PaytechPaymentResponse> {
  const response = await fetch(`${PAYTECH_API_URL}/payment/request-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      API_KEY: PAYTECH_API_KEY,
      API_SECRET: PAYTECH_API_SECRET,
    },
    body: JSON.stringify({
      item_name: params.description,
      item_price: params.amount,
      currency: params.currency,
      ref_command: params.refCommand,
      command_name: `Paiement ${params.description} - Big Five`,
      env: "test",
      ipn_url: params.ipnUrl,
      success_url: params.returnUrl,
      cancel_url: params.cancelUrl,
      custom_field: JSON.stringify({
        ...(params.metadata || {}),
        email: params.customerEmail,
        firstName: params.customerFirstName,
        lastName: params.customerLastName,
      }),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let paytechMessage = errorBody;
    try {
      const parsed = JSON.parse(errorBody);
      paytechMessage = parsed.message || errorBody;
    } catch {}
    console.error("[PayTech] Payment init failed:", response.status, errorBody);
    const error = new Error(paytechMessage);
    (error as any).status = response.status;
    (error as any).paytechError = true;
    throw error;
  }

  const data = await response.json();

  if (data.success !== 1) {
    console.error("[PayTech] Payment init unsuccessful:", data);
    const error = new Error(data.message || "Erreur PayTech inconnue");
    (error as any).paytechError = true;
    throw error;
  }

  return data;
}

export async function verifyPayment(
  token: string
): Promise<PaytechStatusResponse> {
  const response = await fetch(
    `${PAYTECH_API_URL}/payment/get-status?token_payment=${encodeURIComponent(token)}`,
    {
      method: "GET",
      headers: {
        API_KEY: PAYTECH_API_KEY,
        API_SECRET: PAYTECH_API_SECRET,
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`PayTech verify error: ${response.status} - ${errorBody}`);
  }

  return response.json();
}

/**
 * Verify IPN (Instant Payment Notification) signature from PayTech
 * Uses HMAC-SHA256 verification: message = item_price|ref_command|api_key
 */
export function verifyIpnSignature(
  itemPrice: number,
  refCommand: string,
  receivedHmac: string
): boolean {
  const message = `${itemPrice}|${refCommand}|${PAYTECH_API_KEY}`;
  const expectedHmac = crypto
    .createHmac("sha256", PAYTECH_API_SECRET)
    .update(message)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(receivedHmac),
      Buffer.from(expectedHmac)
    );
  } catch {
    return false;
  }
}

/**
 * Alternative IPN verification using SHA256 hash comparison of API keys
 */
export function verifyIpnSha256(
  receivedKeyHash: string,
  receivedSecretHash: string
): boolean {
  const expectedKeyHash = crypto
    .createHash("sha256")
    .update(PAYTECH_API_KEY)
    .digest("hex");
  const expectedSecretHash = crypto
    .createHash("sha256")
    .update(PAYTECH_API_SECRET)
    .digest("hex");

  return (
    expectedKeyHash === receivedKeyHash &&
    expectedSecretHash === receivedSecretHash
  );
}
