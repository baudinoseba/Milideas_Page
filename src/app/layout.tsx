import type { Metadata } from "next";
import { DM_Sans, Caveat, Playfair_Display, Amatic_SC } from "next/font/google";
import "./globals.css";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/utils/constants";

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

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: APP_NAME,
    description: APP_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

import { ToastContainer } from "@/components/ui/toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${dmSans.variable} ${caveat.variable} ${playfairDisplay.variable} ${amaticSc.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased bg-background text-foreground transition-colors duration-300">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
