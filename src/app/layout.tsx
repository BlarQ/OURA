import type { Metadata } from 'next';
import { Nunito_Sans, Geist_Mono } from 'next/font/google';
import './globals.css';

const nunitoSans = Nunito_Sans({
  variable: '--font-proxima-nova',
  subsets: ['latin'],
  weight: ['400', '700', '800'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AdeManual — IT Procedure Documentation & Execution System',
  description: 'Standard Operating Procedures with photo, video, and terminal execution guides.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${nunitoSans.variable} ${geistMono.variable} antialiased bg-[#ffffff] text-[#040404] min-h-screen font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
