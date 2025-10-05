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
      <body>
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
