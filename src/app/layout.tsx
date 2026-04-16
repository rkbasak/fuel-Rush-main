import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fuel Rush — Bangladesh Fuel Intelligence',
  description: 'Real-time AI-verified fuel intelligence for Bangladesh. Find available fuel stations, plan your route, and track your ration.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
  keywords: ['fuel', 'bangladesh', 'gas station', 'fuel tracking', 'ration', 'real-time'],
  authors: [{ name: 'Fuel Rush Team' }],
  openGraph: {
    title: 'Fuel Rush',
    description: 'Real-time fuel intelligence for Bangladesh',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0A0F1E',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans bg-background text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
