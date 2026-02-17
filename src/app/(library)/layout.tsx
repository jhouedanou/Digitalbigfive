import type { Metadata, Viewport } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Ma Bibliothèque | Digital Big Five",
  description: "Votre bibliothèque de ressources numériques - Lisez vos PDFs hors ligne",
  manifest: "/manifest-library.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ma Bibliothèque",
  },
};

export const viewport: Viewport = {
  themeColor: "#1f2937",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-900">
      {children}
      
      {/* Register library service worker */}
      <Script
        id="library-sw-register"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw-library.js').then(function(reg) {
                console.log('Library SW registered:', reg.scope);
              });
            }
          `,
        }}
      />
    </div>
  );
}
