import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { siteConfig } from '@/config/site';
import { CustomCursor } from '@/components/ui/CustomCursor';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#08080D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: `${siteConfig.name} - Free Fire Competitive Esports Tournament Platform`,
  description: siteConfig.description,
  keywords: [
    'Free Fire Tournaments',
    'Free Fire Custom Room',
    'Esports Tournament Platform',
    'Void X Arena',
    'Clash Squad 4v4',
    'Free Fire Battle Royale',
    'Gaming Tournaments India',
    'Free Fire Esports',
  ],
  authors: [{ name: 'VOID X ARENA' }],
  creator: 'VOID X ARENA',
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: 'VOID X ARENA Esports Tournament Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} dark scroll-smooth`}>
      <body className="bg-void-900 text-void-100 font-sans antialiased min-h-screen selection:bg-purple-brand selection:text-white">
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
