'use client';

import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import {installDemucsAction} from '@/services/install-demucs';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'VoiceMorph',
  description: 'Change voices in a song using your own voice.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClientRootLayout>{children}</ClientRootLayout>
      </body>
    </html>
  );
}

// Client component wrapper to handle side effects

import {useEffect} from 'react';

function ClientRootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const install = async () => {
      try {
        if (process.env.NODE_ENV !== 'test' && process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production') {
          await installDemucsAction();
        }
      } catch (e: any) {
        console.error('Failed to install Demucs:', e);
      }
    };
    install();
  }, []);

  return <>{children}</>;
}
