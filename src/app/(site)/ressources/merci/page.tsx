import Link from "next/link";
import { CheckCircle, Mail, Clock, ArrowRight, Sparkles } from "lucide-react";
import ProductRecommendations, { getRecommendedProducts } from "@/components/upsell/ProductRecommendations";

interface PageProps {
  searchParams: Promise<{
    category?: string;
    resourceId?: string;
  }>;
}

export default async function ThankYouPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  // Fetch recommended paid products based on the downloaded resource's category
  const recommendedProducts = await getRecommendedProducts(
    params.category,
    params.resourceId,
    3
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
      {/* Success Message */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Merci pour votre téléchargement !
        </h1>
        
        <p className="text-lg text-gray-600 mb-6 max-w-md mx-auto">
          Votre ressource a été téléchargée avec succès. Profitez-en !
        </p>

        <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 px-4 py-2 rounded-full text-sm">
          <Mail className="w-4 h-4" />
          <span>Si vous avez rempli le formulaire, vérifiez aussi votre email</span>
        </div>
      </div>

      {/* Upsell Section */}
      {recommendedProducts.length > 0 && (
        <div className="mb-12">
          <ProductRecommendations 
            products={recommendedProducts}
            title="Envie d'aller plus loin ?"
            subtitle="Découvrez nos formations premium pour maîtriser complètement le sujet"
            variant="full"
          />
        </div>
      )}

      {/* Alternative CTA if no products */}
      {recommendedProducts.length === 0 && (
        <div className="bg-gradient-to-r from-[#80368D] to-[#29358B] rounded-2xl p-8 text-center text-white mb-12">
          <Sparkles className="w-8 h-8 mx-auto mb-4 text-yellow-300" />
          <h2 className="text-2xl font-bold mb-2">Découvrez nos formations premium</h2>
          <p className="text-white/80 mb-6">
            Accédez à des contenus exclusifs et approfondis pour développer vos compétences
          </p>
          <Link
            href="/?access=paid"
            className="inline-flex items-center gap-2 bg-white text-[#80368D] px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
          >
            Explorer les formations
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      )}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
        >
          Retour à l&apos;accueil
        </Link>
        <Link
          href="/?access=free"
          className="inline-flex items-center justify-center gap-2 bg-[#80368D] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#6a2d76] transition-colors"
        >
          Plus de ressources gratuites
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
