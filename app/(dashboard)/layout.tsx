import { Navigation } from "@/components/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      {/* Navigation - Sidebar on desktop, BottomNav on mobile */}
      <Navigation />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto lg:p-6 pb-24 lg:pb-6">
        {children}
      </main>
    </div>
  );
}
