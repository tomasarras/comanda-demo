"use client";

import { useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { useRole } from "@/components/RoleProvider";

export default function Topbar({ onMenuClick }) {
  const router = useRouter();
  const { role, clearRole } = useRole();

  function handleSwitchRole() {
    clearRole();
    router.push("/");
  }

  if (!role) return null;
  const Icon = role.icon;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6">
      <button type="button" onClick={onMenuClick} className="p-1.5 text-slate-500 lg:hidden">
        <Menu size={22} />
      </button>

      <div className="hidden text-sm text-slate-400 lg:block">
        Demo de portfolio · sin datos reales
      </div>

      <button
        type="button"
        onClick={handleSwitchRole}
        className="flex items-center gap-2 rounded-full border border-slate-200 py-1.5 pl-1.5 pr-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-white"
          style={{ background: role.color }}
        >
          <Icon size={14} />
        </span>
        {role.label}
        <LogOut size={14} className="text-slate-400" />
      </button>
    </header>
  );
}
