import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google'; // Using Inter as a common sans-serif font
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import { TranslationProvider } from '@/components/translation-provider';
import Script from 'next/script';

const fontSans = FontSans({
  subsets: ['latin', 'cyrillic'], // Add cyrillic subset
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'DayView - Schedule Visualization',
  description: 'Interactive visualization of your daily schedule',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚫️</text></svg>'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable
        )}
      >
        {/* Initial theme from localStorage/system to avoid flash */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function(){
              try {
                var stored = localStorage.getItem('theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (stored === 'dark' || (!stored && prefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            })();
          `}
        </Script>
        <TranslationProvider>
          {children}
          <Toaster />
        </TranslationProvider>
      </body>
    </html>
  );
}
