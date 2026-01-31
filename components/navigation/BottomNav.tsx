"use client";

import { ClipboardList, Users, LayoutDashboard, FileText } from "lucide-react";
import { NavItem } from "./NavItem";

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
      </div>
    </nav>
  );
}
