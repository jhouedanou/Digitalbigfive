const CHARIOW_API_URL = "https://api.chariow.com/v1";
const CHARIOW_API_KEY = process.env.CHARIOW_API_KEY!;
const CHARIOW_STORE_URL =
  process.env.CHARIOW_STORE_URL || "https://ressources.bigfive.solutions";


// ---------- Types ----------

export interface ChariowProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  type: string;
  category: { value: string; label: string };
  status: string;
  is_free: boolean;
  pictures: {
    thumbnail: string | null;
    cover: string | null;
  };
  pricing: {
    type: string;
    current_price: ChariowPrice;
    price: ChariowPrice;
    effective: ChariowPrice;
    sale_price: ChariowPrice | null;
    price_off: string | null;
  };
  quantity: {
    value: number;
    remaining: { value: number; percent: number };
    sold: { value: number; percent: number };
    total: number;
  };
  rating: {
    total_ratings: { value: number };
    thumbs_up_count: number;
    thumbs_up_percentage: string;
  };
  sales_count: { value: number } | null;
  custom_cta_text: { value: string; label: string } | null;
}

interface ChariowPrice {
  raw: number | null;
  value: number | null;
  formatted: string | null;
  short: string | null;
  currency: string;
}

interface ChariowPagination {
  count: number;
  per_page: number;
  has_more_pages: boolean;
  next_page_url: string | null;
}

interface ChariowProductsResponse {
  data: ChariowProduct[];
  pagination: ChariowPagination;
}

export interface ChariowResource {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  coverImage: string;
  type: "free" | "paid";
  category: string;
  level: string;
  resourceType: string;
  price: number;
  originalPrice: number | null;
  currency: string;
  priceFormatted: string;
  originalPriceFormatted: string | null;
  priceOff: string | null;
  externalUrl: string;
  source: "chariow";
  chariowProductId: string;
  storeDomain: string;
}

// ---------- API Client ----------

async function chariowFetch<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${CHARIOW_API_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${CHARIOW_API_KEY}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 300 },
  } as RequestInit);

  if (!res.ok) {
    throw new Error(`Chariow API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// ---------- Helpers ----------

function formatXof(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ---------- Public functions ----------

export async function getChariowProducts(): Promise<ChariowProduct[]> {
  const response = await chariowFetch<ChariowProductsResponse>("/products");
  return response.data.filter((p) => p.status === "published");
}

export async function getChariowProductBySlug(
  slug: string
): Promise<ChariowProduct | null> {
  const products = await getChariowProducts();
  return products.find((p) => p.slug === slug) || null;
}

/**
 * Retourne tous les produits Chariow mappés en ChariowResource.
 */
export async function getAllChariowResources(): Promise<ChariowResource[]> {
  const products = await getChariowProducts();
  return products.map(mapChariowToResource);
}

/**
 * Transforme un produit Chariow en format compatible avec ResourceCard.
 * Convertit les prix GNF en XOF (FCFA).
 */
export function mapChariowToResource(product: ChariowProduct): ChariowResource {
  const isFree = product.is_free;

  // Use effective price first, then current_price, then price as fallback
  const currentPrice =
    product.pricing.effective?.value ??
    product.pricing.current_price?.value ??
    0;
  const originalPrice = product.pricing.price?.value ?? 0;

  return {
    id: product.id,
    slug: product.slug,
    title: product.name,
    shortDescription: stripHtml(product.description).slice(0, 200),
    description: product.description,
    coverImage: product.pictures.thumbnail || "",
    type: isFree ? "free" : "paid",
    category: product.category.label,
    level: "",
    resourceType: product.type === "downloadable" ? "Guide" : product.type,
    price: currentPrice,
    originalPrice: originalPrice > currentPrice ? originalPrice : null,
    currency: "XOF",
    priceFormatted: isFree ? "Gratuit" : formatXof(currentPrice),
    originalPriceFormatted:
      originalPrice > currentPrice ? formatXof(originalPrice) : null,
    priceOff: product.pricing.price_off,
    externalUrl: `${CHARIOW_STORE_URL}/${product.slug}`,
    source: "chariow",
    chariowProductId: product.id,
    storeDomain: new URL(CHARIOW_STORE_URL).hostname,
  };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}
