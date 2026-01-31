"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

// Routes that use the marketing header
const marketingRoutes = ["/"];

export function ConditionalHeader() {
  const pathname = usePathname();

  // Show header only on marketing routes
  const showHeader = marketingRoutes.includes(pathname);

  if (!showHeader) {
    return null;
  }

  return <Header />;
}
