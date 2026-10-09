import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AutoReach AI — Smart Spreadsheet & Follow-Up Management System',
  description:
    'AI-powered cold email outreach and automated 3-stage follow-up sequencer with reply detection and anti-spam personalization.',
};

import { Providers } from '@/components/Providers';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f3f4f8] text-gray-900 selection:bg-[#7c3aed]/20 selection:text-[#7c3aed]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
