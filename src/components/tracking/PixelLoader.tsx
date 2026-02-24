/**
 * PixelLoader — Server Component
 * Lit la configuration Meta Pixel depuis la base de données et injecte le script fbq.
 * Fallback sur la variable d'environnement META_PIXEL_ID si la DB échoue.
 * À placer dans le root layout pour que le Pixel soit disponible sur toutes les pages.
 */

import { prisma } from "@/lib/prisma";
import MetaPixel from "@/components/tracking/MetaPixel";

// Fallback : variable d'environnement (fiable même si la DB est inaccessible)
const ENV_PIXEL_ID = process.env.META_PIXEL_ID || "";

export default async function PixelLoader() {
  let pixelId = ENV_PIXEL_ID;

  try {
    const settings = await prisma.siteSettings.findMany({
      where: { key: { in: ["meta_pixel_enabled", "meta_pixel_id"] } },
    });

    const config: Record<string, string> = {};
    settings.forEach((s) => {
      config[s.key] = s.value;
    });

    // La DB prime sur la variable d'environnement
    if (config.meta_pixel_id) {
      pixelId = config.meta_pixel_id;
    }
  } catch (err) {
    console.warn("[PixelLoader] ⚠️ DB inaccessible, fallback sur META_PIXEL_ID env:", ENV_PIXEL_ID || "(vide)", err);
  }

  if (!pixelId) {
    console.warn("[PixelLoader] ⚠️ Aucun Pixel ID trouvé (ni DB, ni env)");
    return null;
  }

  console.log("[PixelLoader] ✅ Pixel ID:", pixelId);
  return <MetaPixel pixelId={pixelId} />;
}
