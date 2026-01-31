"use client";

import { ClipboardList, Users, LayoutDashboard, FileText, Settings } from "lucide-react";
import { NavItem } from "./NavItem";
import { Wrench } from "lucide-react";
import { UserButton } from "@clerk/nextjs";


const mainNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/jobs", icon: ClipboardList, label: "Jobs" },
  { href: "/customers", icon: Users, label: "Clients" },
  { href: "/quotes", icon: FileText, label: "Quotes" },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="bg-secondary p-2 rounded">
            <Wrench className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide">TRADIE APP</h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {mainNavItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            variant="sidebar"
          />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-border space-y-1">
        <NavItem
          href="/settings"
          icon={Settings}
          label="Settings"
          variant="sidebar"
        />
        <div className="flex items-center gap-3 px-4 py-3">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-5 w-5 rounded-full"
              }
            }}
          />
          <span className="text-muted-foreground">Account</span>
        </div>
      </div>
    </aside>
  );
}
