import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://speedcheck.io'),
  title: {
    default: 'Internet Speed Test – Check Your WiFi & Broadband Speed | SpeedCheck',
    template: '%s | SpeedCheck',
  },
  description:
    'Free internet speed test tool. Check your download speed, upload speed, and ping latency in seconds. Works on WiFi, 4G, 5G, and broadband connections.',
  keywords: [
    'internet speed test',
    'wifi speed test',
    'check internet speed',
    'broadband speed test',
    'download speed test',
    'upload speed test',
    'ping test',
    'network speed checker',
  ],
  authors: [{ name: 'SpeedCheck' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://speedcheck.io',
    siteName: 'SpeedCheck',
    title: 'Internet Speed Test ��� Check Your WiFi Speed',
    description:
      'Free internet speed test. Measure download, upload, and ping in real-time.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Internet Speed Test – SpeedCheck',
    description: 'Free internet speed test. Measure download, upload, and ping.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1 },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
