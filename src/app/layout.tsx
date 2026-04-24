import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Portal 771",
  description: "Archivo personal de observación urbana en Pachuca.",
  metadataBase: new URL("https://portal-771.vercel.app"),
  openGraph: {
    title: "Portal 771",
    description: "Archivo personal de observación urbana en Pachuca.",
    url: "https://portal-771.vercel.app",
    siteName: "Portal 771",
    images: [
      {
        url: "/og/portal-771-og.jpg",
        width: 1200,
        height: 630,
        alt: "Portal 771 – Archivo de observación urbana en Pachuca",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Portal 771",
    description: "Archivo personal de observación urbana en Pachuca.",
    images: ["/og/portal-771-og.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${ibmPlexSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
