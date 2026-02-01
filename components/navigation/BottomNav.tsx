"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ClipboardList, Users, LayoutDashboard, FileText, CheckCircle, Menu, X } from "lucide-react";
import { NavItem } from "./NavItem";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import Link from "next/link";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/tasks", icon: CheckCircle, label: "Tasks" },
  { href: "/jobs", icon: ClipboardList, label: "Jobs" },
  { href: "/customers", icon: Users, label: "Clients" },
  { href: "/quotes", icon: FileText, label: "Quotes" },
];

const collapsibleRoutes = ["/dashboard", "/tasks", "/jobs", "/customers", "/quotes"];

export function BottomNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [fabPosition, setFabPosition] = useState<{ left: number; bottom: number } | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  const isCollapsibleRoute = collapsibleRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const updatePosition = () => {
      if (menuButtonRef.current) {
        const rect = menuButtonRef.current.getBoundingClientRect();
        setFabPosition({
          left: rect.left + rect.width / 2,
          bottom: window.innerHeight - rect.top + 16
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  if (!isCollapsibleRoute) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 pb-safe">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              variant="bottom"
            />
          ))}
          <div className="flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-[64px]">
            <div className="p-2 rounded-xl bg-transparent">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-6 w-6 rounded-full"
                  }
                }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              Account
            </span>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-[49] transition-opacity duration-300",
          isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* FAB Menu Items - positioned absolutely on screen */}
      {fabPosition && (
        <div
          className={cn(
            "fixed z-[51] flex flex-col-reverse items-start gap-3 transition-all duration-300 ease-out",
            isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
          style={{
            left: fabPosition.left - 32,
            bottom: fabPosition.bottom,
          }}
        >
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const delay = isMenuOpen ? (navItems.length - 1 - index) * 50 : 0;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                style={{ 
                  transitionDelay: `${delay}ms`,
                  transitionProperty: 'transform, opacity',
                  transitionDuration: '200ms',
                  transitionTimingFunction: 'ease-out'
                }}
                className={cn(
                  "h-12 pl-2 pr-2 rounded-full shadow-lg flex items-center gap-3",
                  "bg-primary text-primary-foreground hover:scale-105",
                  isActive && "ring-2 ring-offset-2 ring-primary",
                  isMenuOpen ? "scale-100 opacity-100" : "scale-0 opacity-0"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 pb-safe">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-[64px] transition-colors",
              isMenuOpen ? "text-secondary" : "text-muted-foreground"
            )}
          >
            <div
              className={cn(
                "p-2 rounded-full transition-colors",
                isMenuOpen ? "bg-secondary text-secondary-foreground" : "bg-transparent"
              )}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </div>
            <span className="text-xs font-medium">
              Menu
            </span>
          </button>

          <div className="flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-[64px]">
            <div className="p-2 rounded-xl bg-transparent">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-6 w-6 rounded-full"
                  }
                }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              Account
            </span>
          </div>
        </div>
      </nav>
    </>
  );
}
