import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import Header from '@/components/Header';
import './globals.css';
import { Geist } from 'next/font/google';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: 'Corporate Translator',
  description:
    'Translate everyday English into LinkedIn corporate jargon and back again.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-full flex flex-col">
        <Header />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
