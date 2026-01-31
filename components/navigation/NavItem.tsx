"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  variant?: "bottom" | "sidebar";
}

export function NavItem({ href, icon: Icon, label, isActive, variant = "bottom" }: NavItemProps) {
  const pathname = usePathname();
  const active = isActive ?? (pathname === href || pathname.startsWith(`${href}/`));

  if (variant === "sidebar") {
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
          active
            ? "bg-secondary text-secondary-foreground font-semibold"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </Link>
    );
  }

  // Bottom nav variant (mobile)
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-[64px] transition-colors",
        active
          ? "text-secondary"
          : "text-muted-foreground"
      )}
    >
      <div
        className={cn(
          "p-2 rounded-xl transition-colors",
          active ? "bg-secondary/20" : "bg-transparent"
        )}
      >
        <Icon className={cn("h-6 w-6", active && "stroke-[2.5px]")} />
      </div>
      <span className={cn("text-xs font-medium", active && "font-semibold")}>
        {label}
      </span>
    </Link>
  );
}
