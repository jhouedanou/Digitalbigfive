import { NextResponse } from "next/server";
import { getAllChariowResources } from "@/lib/chariow";

/**
 * GET /api/public/resources/filters
 * Retourne les valeurs uniques de catégories, types, niveaux et formats
 * extraites dynamiquement depuis les produits Chariow.
 */
export async function GET() {
  try {
    const resources = await getAllChariowResources();

    // Extraire les valeurs uniques et non-vides
    const categories = [
      ...new Set(resources.map((r) => r.category).filter(Boolean)),
    ].sort();

    const resourceTypes = [
      ...new Set(resources.map((r) => r.resourceType).filter(Boolean)),
    ].sort();

    const levels = [
      ...new Set(resources.map((r) => r.level).filter(Boolean)),
    ].sort();

    // Le format n'existe pas dans Chariow, mais on peut le déduire
    // du type de fichier ou des métadonnées si disponibles.
    // Pour l'instant, on retourne un tableau vide si aucun format n'est trouvé.
    const formats = [
      ...new Set(
        resources
          .map((r) => (r as unknown as Record<string, string>).format)
          .filter(Boolean)
      ),
    ].sort();

    return NextResponse.json(
      {
        categories,
        resourceTypes,
        levels,
        formats,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch filters:", error);
    return NextResponse.json(
      {
        categories: [],
        resourceTypes: [],
        levels: [],
        formats: [],
      },
      { status: 500 }
    );
  }
}
