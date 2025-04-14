'use client';

import {useEffect} from 'react';
import {installDemucsAction} from '@/services/install-demucs';

export default function ClientRootLayout({children}: {children: React.ReactNode}) {
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
