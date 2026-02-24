import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Ma Bibliothèque | Digital Big Five",
  description: "Votre bibliothèque de ressources numériques",
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
    </div>
  );
}
