"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useRole } from "@/components/RoleProvider";
import { getAllowedSections, isSectionAllowed } from "@/lib/roles";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { roleId, role, loaded } = useRole();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loaded && !roleId) router.replace("/");
  }, [loaded, roleId, router]);

  useEffect(() => {
    if (!loaded || !role) return;
    const sectionId = pathname.split("/")[1];
    if (!isSectionAllowed(role, sectionId)) {
      router.replace(getAllowedSections(role)[0]?.href || "/");
    }
  }, [loaded, role, pathname, router]);

  if (!loaded || !roleId || !isSectionAllowed(role, pathname.split("/")[1])) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Cargando…</div>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
