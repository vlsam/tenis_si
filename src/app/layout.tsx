import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import DemoBanner from '@/components/DemoBanner';
import './globals.css';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';
const title = `${isDemo ? '[TEST] ' : ''}TK77 Skalica - Rezervácie kurtov`;
const description = 'Tenisový klub TK77 Skalica - 7 vonkajších antukových kurtov, rezervácie online a kredit cez QR platbu.';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tenis.seres.cz'),
  title,
  description,
  manifest: '/manifest.json',
  icons: {
    // SVG only - works as the browser tab favicon and for Android/Chrome
    // "Add to Home Screen" (which reads manifest.json icons, also SVG).
    // iOS Safari's home-screen icon specifically needs a PNG
    // <link rel="apple-touch-icon">, which isn't generated yet - see README.
    icon: '/icons/icon.svg'
  },
  openGraph: {
    title,
    description,
    locale: 'sk_SK',
    type: 'website'
    // No `images` - there's no real club photo in the repo yet (see README),
    // and a broken preview image is worse than none. Add a 1200x630 photo
    // here once the club has one.
  },
  twitter: {
    card: 'summary',
    title,
    description
  }
};

export const viewport: Viewport = {
  themeColor: '#1e7a34'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk">
      <body className="flex min-h-screen flex-col">
        <DemoBanner />
        <Nav />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
        <Footer />
        <Script src="/register-sw.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
