"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "../../components/admin/AdminSidebar";
import { AdminHeader } from "../../components/admin/AdminHeader";
import { useCurrentUser } from "../../hooks/useCurrentUser";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: user, isError, isLoading } = useCurrentUser();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  React.useEffect(() => {
    if (isLoading || isError) return;
    if (!user) {
      router.replace("/login");
    } else if (user.role !== "admin") {
      router.replace("/");
    }
  }, [isError, isLoading, router, user]);

  if (isLoading || isError || !user || user.role !== "admin") {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-background text-foreground"
        role="status"
      >
        {isError
          ? "Unable to verify administrator access."
          : "Checking administrator access..."}
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <AdminSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader onMenuClick={() => setIsMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-neutral-950/50 p-6 md:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
