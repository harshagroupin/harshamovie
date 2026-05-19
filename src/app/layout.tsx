import type { Metadata, Viewport } from "next";
import { Nunito_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { APP_NAME, APP_TAGLINE, APP_DESCRIPTION } from "@/lib/constants";

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
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: ["movie tickets", "cinema booking", "Harsha Movies Karnal", "movie theater", "book tickets online", "Karnal cinema"],
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
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" style={{ scrollbarWidth: "none", overscrollBehavior: "none" }}>
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
