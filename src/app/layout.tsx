import type { Metadata } from "next";
import { DM_Sans, Caveat, Playfair_Display, Amatic_SC } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-recoleta",
  display: "swap",
});

const amaticSc = Amatic_SC({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-amatic",
  display: "swap",
});

import { getBaseUrl } from "@/lib/urls";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: "Milideas Arte | Cerámica de Autor & Ilustración en Sunchales",
    template: "%s | Milideas Arte",
  },
  description:
    "Estudio de arte y cerámica artesanal por Milagros Anita Ferrero en Sunchales, Santa Fe, Argentina. Mates, vajilla ilustrada, obras únicas y encargos personalizados a todo el país.",
  keywords: [
    "Milideas",
    "Milideas Arte",
    "Milagros Anita Ferrero",
    "Mili Ferrero",
    "cerámica de autor",
    "cerámica ilustrada",
    "cerámica artesanal",
    "taller de cerámica Sunchales",
    "cerámica Rafaela",
    "cerámica Santa Fe",
    "ilustraciones de autor",
    "murales artísticos",
    "decoración de cerámica de autor",
    "vajilla pintada a mano",
    "mates artesanales",
    "encargos personalizados cerámica",
  ],
  authors: [{ name: "Milagros Anita Ferrero", url: "https://instagram.com/milideas_arte" }],
  creator: "Milagros Anita Ferrero",
  publisher: "Milideas Arte",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/logo-circle.png", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: getBaseUrl(),
    siteName: "Milideas Arte",
    title: "Milideas Arte | Cerámica de Autor & Ilustración",
    description:
      "Estudio de arte y cerámica artesanal en Sunchales, Santa Fe, Argentina. Piezas únicas y encargos personalizados a medida.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Milideas Arte | Cerámica de Autor & Ilustración",
    description:
      "Estudio de arte y cerámica artesanal en Sunchales, Santa Fe, Argentina. Piezas únicas y encargos a medida.",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION || undefined,
  },
  robots: { index: true, follow: true },
};

import { ToastContainer } from "@/components/ui/toast";
import { CookieConsentBanner } from "@/components/ui/cookie-banner";
import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["Store", "ArtGallery"],
    name: "Milideas Arte",
    alternateName: ["Milideas", "Milideas Estudio de Arte"],
    legalName: "Milagros Anita Ferrero",
    taxID: "27-43717260-4",
    url: getBaseUrl(),
    description:
      "Estudio de arte y cerámica artesanal por Milagros Anita Ferrero (Mili Ferrero) en Sunchales, Santa Fe, Argentina. Piezas de autor, vajilla ilustrada y obras personalizadas.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Florentino Ameghino 1576",
      addressLocality: "Sunchales",
      addressRegion: "Santa Fe",
      postalCode: "S2322",
      addressCountry: "AR",
    },
    telephone: "+5493493664420",
    email: "contacto@milideasarte.com.ar",
    sameAs: ["https://instagram.com/milideas_arte"],
    priceRange: "$$",
  };

  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${dmSans.variable} ${caveat.variable} ${playfairDisplay.variable} ${amaticSc.variable} h-full`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  document.documentElement.classList.remove('dark');
                  localStorage.removeItem('milideas-theme');
                } catch(e) {}
              })();
            `,
          }}
        />
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
      </head>
      <body className="min-h-full flex flex-col antialiased bg-background text-foreground transition-colors duration-300">
        {children}
        <CookieConsentBanner />
        <ToastContainer />
      </body>
    </html>
  );
}
