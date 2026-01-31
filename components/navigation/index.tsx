"use client";

import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";

export function Navigation() {
  return (
    <>
      {/* Mobile: Bottom navigation */}
      <div className="lg:hidden">
        <BottomNav />
      </div>

      {/* Desktop: Sidebar navigation */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
    </>
  );
}

export { BottomNav } from "./BottomNav";
export { Sidebar } from "./Sidebar";
export { NavItem } from "./NavItem";
