import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter, Oswald } from 'next/font/google';
import ConvexClientProvider from '@/components/ConvexClientProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { OnboardingGuard } from '@/components/OnboardingGuard';
import { Toaster } from '@/components/ui/toaster';
import { ConditionalHeader } from '@/components/ConditionalHeader';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const oswald = Oswald({
  subsets: ['latin'],
  variable: '--font-oswald',
  display: 'swap',
});

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
      signUpFallbackRedirectUrl="/onboarding"
      signInFallbackRedirectUrl="/dashboard"
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} ${oswald.variable} antialiased font-sans`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ConvexClientProvider>
              <div className="min-h-screen flex flex-col">
                <ConditionalHeader />
                <OnboardingGuard>{children}</OnboardingGuard>
              </div>
            </ConvexClientProvider>
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
