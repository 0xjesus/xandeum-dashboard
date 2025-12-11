import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TooltipProvider } from '@/components/ui/tooltip';
import { WatchlistProvider } from '@/contexts/WatchlistContext';
import { APP_META } from '@/lib/constants';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

export const metadata: Metadata = {
  title: {
    default: APP_META.name,
    template: `%s | ${APP_META.name}`,
  },
  description: APP_META.description,
  keywords: [
    'Xandeum',
    'pNodes',
    'Solana',
    'blockchain',
    'storage',
    'analytics',
    'validator',
    'dashboard',
  ],
  authors: [{ name: 'Xandeum Analytics' }],
  creator: 'Xandeum Analytics',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_META.url,
    title: APP_META.name,
    description: APP_META.description,
    siteName: APP_META.name,
    images: [
      {
        url: `${APP_META.url}/og-image.png`,
        width: 1200,
        height: 630,
        alt: APP_META.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_META.name,
    description: APP_META.description,
    images: [`${APP_META.url}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <WatchlistProvider>
            <TooltipProvider>
              <div className="relative flex min-h-screen flex-col">
              {/* Background effects */}
              <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-grid dark:opacity-100 opacity-50" />
                <div className="hero-gradient absolute inset-0" />
              </div>

                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
            </TooltipProvider>
          </WatchlistProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
