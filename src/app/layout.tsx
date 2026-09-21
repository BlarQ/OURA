import type { Metadata, Viewport } from 'next';
import { Nunito_Sans, Geist_Mono } from 'next/font/google';
import './globals.css';
import { PWARegister } from '@/components/pwa/PWARegister';

const nunitoSans = Nunito_Sans({
  variable: '--font-proxima-nova',
  subsets: ['latin'],
  weight: ['400', '700', '800'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  themeColor: '#98e58e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'AdeManual — IT Procedure Documentation & Execution System',
  description: 'Standard Operating Procedures with photo, video, and terminal execution guides.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AdeManual',
  },
  icons: {
    icon: [
      { url: '/apple-icon.png?v=3', sizes: '180x180', type: 'image/png' },
      { url: '/favicon.png?v=3', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/apple-icon.png?v=3',
    apple: [
      { url: '/apple-icon.png?v=3', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" sizes="180x180" href="/apple-icon.png?v=3" />
        <link rel="shortcut icon" type="image/png" href="/apple-icon.png?v=3" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png?v=3" />
      </head>
      <body
        className={`${nunitoSans.variable} ${geistMono.variable} antialiased bg-paper-white text-ink-black min-h-screen font-sans`}
      >
        <PWARegister />
        {children}
      </body>
    </html>
  );
}

