/**
 * PixelLoader — Server Component
 * Lit la configuration Meta Pixel depuis la base de données et injecte le script fbq.
 * À placer dans le root layout pour que le Pixel soit disponible sur toutes les pages.
 */

import { prisma } from "@/lib/prisma";
import MetaPixel from "@/components/tracking/MetaPixel";

export default async function PixelLoader() {
  try {
    const settings = await prisma.siteSettings.findMany({
      where: { key: { in: ["meta_pixel_enabled", "meta_pixel_id"] } },
    });

    const config: Record<string, string> = {};
    settings.forEach((s) => {
      config[s.key] = s.value;
    });

    const pixelId = config.meta_pixel_id || "";

    // Actif dès qu'un Pixel ID est renseigné (pas besoin de case à cocher)
    if (!pixelId) return null;

    return <MetaPixel pixelId={pixelId} />;
  } catch {
    // Si la DB n'est pas accessible (ex: build statique), ne rien afficher
    return null;
  }
}
