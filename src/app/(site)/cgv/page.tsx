import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente | Big Five Digital",
  description:
    "Conditions générales de vente de Big Five Digital Agency. Découvrez nos modalités de commande, paiement, livraison et remboursement.",
};

export default function CGVPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-black text-[#29358B] mb-8">
        Conditions Générales de Vente
      </h1>

      <p className="text-sm text-gray-500 mb-10">
        Dernière mise à jour : janvier 2025
      </p>

      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-[#29358B] mb-4">
            Article 1 — Identification du vendeur
          </h2>
          <p className="text-gray-700">
            Big Five Digital Agency, société exerçant son activité au Sénégal,
            est éditeur et vendeur des produits numériques disponibles sur le
            site <strong>digitalbigfive.vercel.app</strong>.
          </p>
          <p className="text-gray-700 mt-2">
            Contact : <a href="mailto:contact@bigfive.agency" className="text-[#29358B] underline">contact@bigfive.agency</a>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#29358B] mb-4">
            Article 2 — Produits et services
          </h2>
          <p className="text-gray-700">
            Big Five Digital Agency propose à la vente des ressources
            numériques téléchargeables (guides, templates, formations au format
            PDF) accessibles depuis l&apos;espace bibliothèque après paiement.
          </p>
          <p className="text-gray-700 mt-2">
            Les produits gratuits sont accessibles sans inscription. Les produits
            payants nécessitent la création d&apos;un compte et le règlement du
            montant indiqué sur la page produit.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#29358B] mb-4">
            Article 3 — Prix
          </h2>
          <p className="text-gray-700">
            Les prix sont indiqués en francs CFA (XOF) TTC. Big Five Digital
            Agency se réserve le droit de modifier ses prix à tout moment. Les
            commandes sont facturées au tarif en vigueur au moment de la
            validation.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#29358B] mb-4">
            Article 4 — Modalités de paiement
          </h2>
          <p className="text-gray-700">
            Les paiements sont traités via <strong>PayTech</strong>, plateforme
            de paiement sécurisée. Nous acceptons les moyens de paiement
            disponibles sur PayTech (cartes bancaires, Wave, Orange Money, etc.).
          </p>
          <p className="text-gray-700 mt-2">
            La commande est validée dès réception de la confirmation de
            paiement de PayTech. Toutes les transactions sont sécurisées par
            chiffrement SSL.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#29358B] mb-4">
            Article 5 — Livraison
          </h2>
          <p className="text-gray-700">
            Les produits numériques sont mis à disposition instantanément dans
            votre espace bibliothèque après confirmation du paiement. Aucune
            livraison physique n&apos;est effectuée.
          </p>
          <p className="text-gray-700 mt-2">
            Un email de confirmation vous est envoyé à l&apos;adresse fournie lors
            de la commande.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#29358B] mb-4">
            Article 6 — Droit de rétractation
          </h2>
          <p className="text-gray-700">
            Conformément à la nature dématérialisée des produits vendus, et
            après fourniture immédiate du contenu numérique suite au paiement,
            le droit de rétractation ne s&apos;applique pas aux achats de contenus
            numériques dès lors que le téléchargement ou l&apos;accès a commencé.
          </p>
          <p className="text-gray-700 mt-2">
            En cas de problème technique ou d&apos;erreur de notre part, contactez-nous
            à{" "}
            <a href="mailto:contact@bigfive.agency" className="text-[#29358B] underline">
              contact@bigfive.agency
            </a>{" "}
            dans les 7 jours suivant l&apos;achat.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#29358B] mb-4">
            Article 7 — Propriété intellectuelle
          </h2>
          <p className="text-gray-700">
            L&apos;ensemble des ressources vendues est la propriété exclusive de
            Big Five Digital Agency. Toute reproduction, diffusion, revente ou
            exploitation commerciale est strictement interdite sans autorisation
            écrite préalable.
          </p>
          <p className="text-gray-700 mt-2">
            Les fichiers sont destinés à un usage strictement personnel et
            professionnel de l&apos;acheteur.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#29358B] mb-4">
            Article 8 — Données personnelles
          </h2>
          <p className="text-gray-700">
            Les données collectées lors de la commande (nom, email) sont
            utilisées uniquement pour la gestion de votre compte et l&apos;envoi de
            votre commande. Elles ne sont pas revendues à des tiers.
            Consultez nos{" "}
            <a href="/mentions-legales" className="text-[#29358B] underline">
              mentions légales
            </a>{" "}
            pour plus d&apos;informations.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#29358B] mb-4">
            Article 9 — Litiges
          </h2>
          <p className="text-gray-700">
            En cas de litige, une solution amiable sera recherchée avant toute
            action judiciaire. Les présentes CGV sont soumises au droit
            sénégalais. Tout litige relève de la compétence des tribunaux
            compétents du Sénégal.
          </p>
        </section>
      </div>
    </div>
  );
}
