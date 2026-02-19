import type { Metadata, Viewport } from 'next';
import React from 'react';
import '@/app/globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Inventory Management',
  description: 'An inventory management app.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className='flex w-full bg-gradient-to-br from-zinc-900 via-zinc-700 to-zinc-950 text-zinc-100'>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
