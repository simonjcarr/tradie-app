import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import ConvexClientProvider from '@/components/ConvexClientProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tradie App',
  description: 'A modern tradie management application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      dynamic
      appearance={{
        cssLayerName: 'clerk' // Required for Tailwind 4 compatibility
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className="antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ConvexClientProvider>{children}</ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
