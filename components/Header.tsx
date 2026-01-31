'use client';

import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Wrench, LayoutDashboard, Settings, Briefcase, FileText, Users, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/jobs', icon: Briefcase, label: 'Jobs' },
  { href: '/quotes', icon: FileText, label: 'Quotes' },
  { href: '/customers', icon: Users, label: 'Customers' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-primary text-primary-foreground border-b-4 border-secondary">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo and Brand */}
          <div className="flex items-center gap-2 sm:gap-8">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
              <div className="bg-secondary p-1.5 sm:p-2 rounded">
                <Wrench className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold tracking-wide">TRADIE APP</h1>
                <p className="hidden sm:block text-xs text-primary-foreground/80 uppercase tracking-wider">Professional Tools Management</p>
              </div>
            </Link>

            {/* Desktop Navigation - Only shown when signed in */}
            <SignedIn>
              <nav className="hidden lg:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={pathname === item.href ? 'secondary' : 'ghost'}
                      size="default"
                      className={pathname === item.href
                        ? 'text-primary'
                        : 'text-primary-foreground hover:bg-primary/80'
                      }
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </nav>
            </SignedIn>
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            
            {/* Mobile Menu Button - Only for signed in users */}
            <SignedIn>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-primary-foreground hover:bg-primary/80"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </SignedIn>

            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm" className="hidden sm:flex text-primary-foreground hover:bg-primary/80">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button variant="secondary" size="sm" className="shadow-lg hover:shadow-xl">
                  <span className="sm:hidden">Start</span>
                  <span className="hidden sm:inline">Get Started</span>
                </Button>
              </SignUpButton>
            </SignedOut>
            
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 sm:w-10 sm:h-10 border-2 border-secondary"
                  }
                }}
              />
            </SignedIn>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <SignedIn>
          {mobileMenuOpen && (
            <nav className="lg:hidden mt-4 pb-2 border-t border-primary-foreground/20 pt-4">
              <div className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant={pathname === item.href ? 'secondary' : 'ghost'}
                      size="default"
                      className={`w-full justify-start ${pathname === item.href
                        ? 'text-primary'
                        : 'text-primary-foreground hover:bg-primary/80'
                      }`}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </SignedIn>
      </div>
    </header>
  );
}
