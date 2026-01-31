"use client";

import { ClipboardList, Users, LayoutDashboard, FileText } from "lucide-react";
import { NavItem } from "./NavItem";
import { UserButton } from "@clerk/nextjs";


const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/jobs", icon: ClipboardList, label: "Jobs" },
  { href: "/customers", icon: Users, label: "Clients" },
  { href: "/quotes", icon: FileText, label: "Quotes" },
];

export function BottomNav() {
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
        {/* User Button */}
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
