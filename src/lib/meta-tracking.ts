import crypto from "crypto";
import { prisma } from "./prisma";

function hashSHA256(value: string): string {
  return crypto.createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
}

export async function getMetaConfig() {
  const settings = await prisma.siteSettings.findMany({
    where: {
      key: {
        in: [
          "meta_pixel_enabled",
          "meta_pixel_id",
          "meta_capi_enabled",
          "meta_capi_token",
        ],
      },
    },
  });

  const config: Record<string, string> = {};
  settings.forEach((s) => {
    config[s.key] = s.value;
  });

  return {
    pixelEnabled: config.meta_pixel_enabled === "true",
    pixelId: config.meta_pixel_id || "",
    capiEnabled: config.meta_capi_enabled === "true",
    capiToken: config.meta_capi_token || "",
  };
}

export async function sendCAPIEvent({
  eventName,
  eventId,
  email,
  firstName,
  lastName,
  ip,
  userAgent,
  sourceUrl,
  customData,
}: {
  eventName: string;
  eventId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  ip?: string;
  userAgent?: string;
  sourceUrl?: string;
  customData?: Record<string, unknown>;
}) {
  const config = await getMetaConfig();
  if (!config.capiEnabled || !config.capiToken || !config.pixelId) return;

  const userData: Record<string, unknown> = {};
  if (email) userData.em = [hashSHA256(email)];
  if (firstName) userData.fn = [hashSHA256(firstName)];
  if (lastName) userData.ln = [hashSHA256(lastName)];
  if (ip) userData.client_ip_address = ip;
  if (userAgent) userData.client_user_agent = userAgent;

  const eventData = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        event_source_url: sourceUrl,
        action_source: "website",
        user_data: userData,
        custom_data: customData,
      },
    ],
  };

  try {
    await fetch(
      `https://graph.facebook.com/v18.0/${config.pixelId}/events?access_token=${config.capiToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      }
    );
  } catch (error) {
    console.error("CAPI event failed:", error);
  }
}
