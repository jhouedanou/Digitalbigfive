import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions Légales | Big Five Digital",
  description:
    "Mentions légales de Big Five Digital Agency : éditeur, hébergeur, données personnelles et cookies.",
};

export default function MentionsLegalesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-black text-[#29358B] mb-8">
        Mentions Légales
      </h1>

      <p className="text-sm text-gray-500 mb-10">
        Dernière mise à jour : janvier 2025
      </p>

      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-[#29358B] mb-4">
            1. Éditeur du site
          </h2>
          <p className="text-gray-700">
            Le site <strong>digitalbigfive.vercel.app</strong> est édité par :
          </p>
          <ul className="list-none mt-3 space-y-1 text-gray-700">
            <li>
              <strong>Dénomination :</strong> Big Five Digital Agency
            </li>
            <li>
              <strong>Pays :</strong> Sénégal
            </li>
            <li>
              <strong>Email :</strong>{" "}
              <a href="mailto:contact@bigfive.agency" className="text-[#29358B] underline">
                contact@bigfive.agency
              </a>
            </li>
            <li>
              <strong>Responsable de publication :</strong> Big Five Digital
              Agency
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#29358B] mb-4">
            2. Hébergement
          </h2>
          <p className="text-gray-700">
            Le site est hébergé par :
          </p>
          <ul className="list-none mt-3 space-y-1 text-gray-700">
            <li>
              <strong>Hébergeur :</strong> Vercel Inc.
            </li>
            <li>
              <strong>Adresse :</strong> 340 Pine Street, Suite 601, San
              Francisco, CA 94104, États-Unis
            </li>
            <li>
              <strong>Site :</strong>{" "}
              <a
                href="https://vercel.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#29358B] underline"
              >
                vercel.com
              </a>
            </li>
          </ul>
          <p className="text-gray-700 mt-3">
            La base de données est hébergée par <strong>Supabase</strong>{" "}
            (supabase.com) sur des serveurs situés dans l&apos;Union Européenne.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#29358B] mb-4">
            3. Propriété intellectuelle
          </h2>
          <p className="text-gray-700">
            L&apos;ensemble des contenus présents sur ce site (textes, images,
            logos, ressources numériques) est la propriété exclusive de Big
            Five Digital Agency, sauf mention contraire.
          </p>
          <p className="text-gray-700 mt-2">
            Toute reproduction, représentation, modification, publication ou
            adaptation de tout ou partie des éléments du site, quel que soit le
            moyen ou le procédé utilisé, est interdite sans autorisation écrite
            préalable.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#29358B] mb-4">
            4. Données personnelles
          </h2>
          <p className="text-gray-700">
            Lors de votre inscription et de vos achats, nous collectons les
            données suivantes :
          </p>
          <ul className="list-disc list-inside mt-3 space-y-1 text-gray-700">
            <li>Adresse email (identifiant de compte)</li>
            <li>Nom et prénom (optionnel, pour la facturation)</li>
            <li>Historique des commandes</li>
          </ul>
          <p className="text-gray-700 mt-3">
            Ces données sont utilisées exclusivement pour :
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
            <li>La gestion de votre compte et de vos accès</li>
            <li>L&apos;envoi de vos confirmations de commande</li>
            <li>Le support client</li>
          </ul>
          <p className="text-gray-700 mt-3">
            Vos données ne sont jamais revendues à des tiers. Elles sont
            conservées pendant la durée de vie de votre compte, puis supprimées
            sur demande.
          </p>
          <p className="text-gray-700 mt-2">
            Pour exercer vos droits (accès, rectification, suppression),
            contactez-nous :{" "}
            <a href="mailto:contact@bigfive.agency" className="text-[#29358B] underline">
              contact@bigfive.agency
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#29358B] mb-4">
            5. Cookies
          </h2>
          <p className="text-gray-700">
            Ce site utilise des cookies techniques nécessaires au fonctionnement
            de l&apos;authentification (session Supabase). Aucun cookie publicitaire
            tiers n&apos;est déposé sans votre consentement.
          </p>
          <p className="text-gray-700 mt-2">
            Le site utilise également le{" "}
            <strong>Meta Pixel</strong> à des fins d&apos;analyse marketing. Vous
            pouvez désactiver le suivi via les paramètres de votre navigateur ou
            via les outils de gestion du consentement.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#29358B] mb-4">
            6. Liens hypertextes
          </h2>
          <p className="text-gray-700">
            Le site peut contenir des liens vers des sites tiers. Big Five
            Digital Agency ne peut être tenu responsable du contenu de ces
            sites externes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#29358B] mb-4">
            7. Contact
          </h2>
          <p className="text-gray-700">
            Pour toute question relative aux présentes mentions légales ou à la
            gestion de vos données personnelles, contactez-nous à l&apos;adresse :{" "}
            <a href="mailto:contact@bigfive.agency" className="text-[#29358B] underline">
              contact@bigfive.agency
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
