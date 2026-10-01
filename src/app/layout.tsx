import type { Metadata, Viewport } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import "./globals.css";

const name = process.env.NEXT_PUBLIC_APP_NAME || "Cvia";

export const metadata: Metadata = {
  title: { default: `${name} — Créez un CV professionnel en quelques minutes`, template: `%s · ${name}` },
  description: "Créez un CV propre et moderne depuis votre téléphone, sans compétence technique. Aperçu gratuit, paiement par Mobile Money (MTN, Moov, Celtiis), PDF A4 prêt à envoyer.",
  applicationName: name,
};
export const viewport: Viewport = { themeColor: "#0B6B4F", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
