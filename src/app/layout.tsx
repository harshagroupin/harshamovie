import type { Metadata, Viewport } from "next";
import { Nunito_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { APP_NAME, APP_TAGLINE, APP_DESCRIPTION, APP_URL, BUSINESS } from "@/lib/constants";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-nunito-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "movie tickets",
    "cinema booking",
    "Harsha Movies Karnal",
    "movie theater",
    "book tickets online",
    "Karnal cinema",
    "Harsh A Movie",
    "cinema Karnal"
  ],
  alternates: {
    canonical: "./",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: APP_URL,
    siteName: APP_NAME,
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: APP_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MovieTheater",
    "name": BUSINESS.name,
    "url": APP_URL,
    "logo": `${APP_URL}/logo.png.png`,
    "description": BUSINESS.description,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "GT Road, Sector 12",
      "addressLocality": "Karnal",
      "addressRegion": "Haryana",
      "postalCode": "132001",
      "addressCountry": "IN"
    },
    "telephone": BUSINESS.phone,
    "priceRange": "₹150-₹500",
    "openingHours": "Mo-Su 09:00-23:00"
  };

  return (
    <html lang="en" data-theme="light" style={{ scrollbarWidth: "none", overscrollBehavior: "none" }}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${nunitoSans.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#FFFFFF",
              border: "1px solid #E8E8EA",
              color: "#131316",
            },
          }}
        />
      </body>
    </html>
  );
}
