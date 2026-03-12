import crypto from "crypto";

const MONEROO_API_URL = "https://api.moneroo.io/v1";
const MONEROO_API_KEY = process.env.MONEROO_API_KEY!;

// ─── Types ────────────────────────────────────────────────────────────────────

interface InitializePaymentParams {
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  metadata?: Record<string, string>;
  returnUrl: string;
}

interface MonerooInitResponse {
  message: string;
  data: {
    id: string;
    checkout_url: string;
  };
}

interface MonerooVerifyResponse {
  message: string;
  data: {
    id: string;
    status: "success" | "pending" | "failed" | "cancelled";
    amount: number;
    currency: { code: string };
    description: string;
    metadata: Record<string, string> | null;
    customer: {
      email: string;
      first_name: string;
      last_name: string;
    };
    [key: string]: unknown;
  };
}

// ─── Initialize Payment ───────────────────────────────────────────────────────

export async function initializeMonerooPayment(
  params: InitializePaymentParams
): Promise<MonerooInitResponse["data"]> {
  const response = await fetch(`${MONEROO_API_URL}/payments/initialize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${MONEROO_API_KEY}`,
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency,
      description: params.description,
      customer: {
        email: params.customerEmail,
        first_name: params.customerFirstName,
        last_name: params.customerLastName,
      },
      return_url: params.returnUrl,
      metadata: params.metadata || {},
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[Moneroo] Payment init failed:", response.status, errorBody);
    const error = new Error(`Erreur Moneroo: ${errorBody}`);
    (error as any).status = response.status;
    (error as any).monerooError = true;
    throw error;
  }

  const data: MonerooInitResponse = await response.json();
  return data.data;
}

// ─── Verify Transaction ───────────────────────────────────────────────────────

export async function verifyMonerooTransaction(
  paymentId: string
): Promise<MonerooVerifyResponse["data"]> {
  const response = await fetch(
    `${MONEROO_API_URL}/payments/${paymentId}/verify`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${MONEROO_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[Moneroo] Verify failed:", response.status, errorBody);
    throw new Error(`Moneroo verify error: ${response.status} - ${errorBody}`);
  }

  const data: MonerooVerifyResponse = await response.json();
  return data.data;
}

// ─── Verify Webhook Signature ─────────────────────────────────────────────────

export function verifyMonerooWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const secret = process.env.MONEROO_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[Moneroo] No webhook secret configured, skipping verification");
    return true; // En sandbox sans secret configuré, on accepte
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}
