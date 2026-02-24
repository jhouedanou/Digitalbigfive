import { prisma } from "@/lib/prisma";
import MetaPixel from "./MetaPixel";

export default async function MetaPixelLoader() {
  const settings = await prisma.siteSettings.findMany({
    where: {
      key: { in: ["meta_pixel_enabled", "meta_pixel_id"] },
    },
  });

  const config: Record<string, string> = {};
  settings.forEach((s) => {
    config[s.key] = s.value;
  });

  // Actif dès qu'un Pixel ID est renseigné (cohérent avec PixelLoader)
  if (!config.meta_pixel_id) {
    return null;
  }

  return <MetaPixel pixelId={config.meta_pixel_id} />;
}
