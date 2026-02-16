import crypto from "crypto";

const MONEROO_API_URL = "https://api.moneroo.io/v1";
const MONEROO_SECRET_KEY = process.env.MONEROO_SECRET_KEY!;
const MONEROO_WEBHOOK_SECRET = process.env.MONEROO_WEBHOOK_SECRET!;

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

interface MonerooPaymentResponse {
  status: string;
  message: string;
  data: {
    id: string;
    checkout_url: string;
    status: string;
  };
}

interface MonerooVerifyResponse {
  status: string;
  message: string;
  data: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    metadata: Record<string, string>;
  };
}

export async function initializePayment(
  params: InitializePaymentParams
): Promise<MonerooPaymentResponse> {
  const response = await fetch(`${MONEROO_API_URL}/payments/initialize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MONEROO_SECRET_KEY}`,
      Accept: "application/json",
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
      metadata: params.metadata || {},
      return_url: params.returnUrl,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let monerooMessage = errorBody;
    try {
      const parsed = JSON.parse(errorBody);
      monerooMessage = parsed.message || errorBody;
    } catch {}
    console.error("[Moneroo] Payment init failed:", response.status, errorBody);
    const error = new Error(monerooMessage);
    (error as any).status = response.status;
    (error as any).monerooError = true;
    throw error;
  }

  return response.json();
}

export async function verifyPayment(
  paymentId: string
): Promise<MonerooVerifyResponse> {
  const response = await fetch(
    `${MONEROO_API_URL}/payments/${paymentId}/verify`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${MONEROO_SECRET_KEY}`,
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Moneroo verify error: ${response.status} - ${errorBody}`);
  }

  return response.json();
}

export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", MONEROO_WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
