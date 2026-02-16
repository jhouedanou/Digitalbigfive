"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";

interface Product {
  id: string;
  title: string;
  hasTestimonial: boolean;
}

export default function TestimonialsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/profile/products")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId: selectedProduct,
          rating,
          text,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      setSuccess(true);
      setRating(0);
      setText("");
      setSelectedProduct("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  const availableProducts = products.filter((p) => !p.hasTestimonial);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Laisser un avis</h1>

      {availableProducts.length === 0 ? (
        <p className="text-gray-500 text-center py-16">
          {products.length === 0
            ? "Vous devez acheter un produit pour laisser un avis."
            : "Vous avez déjà laissé un avis pour tous vos produits."}
        </p>
      ) : (
        <div className="max-w-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Produit
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Sélectionner un produit</option>
                {availableProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note *
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i)}
                    className="p-1"
                  >
                    <Star
                      size={24}
                      className={
                        i <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Votre avis * (max 200 caractères)
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 200))}
                required
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">{text.length}/200</p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
                {error}
              </p>
            )}

            {success && (
              <p className="text-sm text-green-600 bg-green-50 rounded-lg p-3">
                Merci ! Votre avis sera publié après validation.
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !rating || !selectedProduct}
              className="bg-[#80368D] text-white py-2 px-6 rounded-lg font-medium hover:bg-[#6a2d76] disabled:opacity-50"
            >
              {loading ? "Envoi..." : "Soumettre mon avis"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
