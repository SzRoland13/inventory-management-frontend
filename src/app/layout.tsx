import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Inventory Management',
  description: 'An inventory management app.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <head />
      <body className='min-h-screen flex flex-col'>
        <main className='flex-1'>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
