import type { Metadata, Viewport } from "next";
import { Nunito_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { APP_NAME, APP_TAGLINE, APP_DESCRIPTION, APP_URL, SEO_KEYWORDS } from "@/lib/constants";
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateMovieTheaterSchema,
} from "@/lib/schema";

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
    ...SEO_KEYWORDS.primary,
    ...SEO_KEYWORDS.secondary,
    ...SEO_KEYWORDS.longTail,
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
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: APP_DESCRIPTION,
    url: APP_URL,
    siteName: APP_NAME,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${APP_NAME} — Premium Cinema in Karnal`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: APP_DESCRIPTION,
    images: [`${APP_URL}/og-image.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const schemas = [
    generateOrganizationSchema(),
    generateWebSiteSchema(),
    generateMovieTheaterSchema(),
  ];

  return (
    <html lang="en" data-theme="light" style={{ scrollbarWidth: "none", overscrollBehavior: "none" }}>
      <head>
        {schemas.map((schema, i) => (
          <script
            key={`schema-${i}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
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
