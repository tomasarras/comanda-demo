"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2, RotateCcw, UtensilsCrossed } from "lucide-react";
import { ROLES } from "@/lib/roles";
import { useRole } from "@/components/RoleProvider";

export default function RoleSelectorPage() {
  const router = useRouter();
  const { roleId, loaded, setRoleId } = useRole();
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  useEffect(() => {
    if (loaded && roleId) router.replace("/panel");
  }, [loaded, roleId, router]);

  function handleSelect(id) {
    setRoleId(id);
    router.push("/panel");
  }

  async function handleReset() {
    setResetting(true);
    setResetMessage("");
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo restablecer la demo");
      setResetMessage("Demo restablecida — todo volvió al estado inicial.");
    } catch (err) {
      setResetMessage(err.message);
    } finally {
      setResetting(false);
      setConfirmingReset(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-600 text-white">
        <UtensilsCrossed size={26} />
      </span>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">
        Com<span className="text-orange-600">anda</span>
      </h1>
      <p className="mt-1 text-sm text-slate-500">Demo de portfolio · elegí con qué rol querés entrar</p>

      <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        {ROLES.map((role) => {
          const Icon = role.icon;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => handleSelect(role.id)}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ background: role.color }}
              >
                <Icon size={20} />
              </span>
              <span>
                <span className="block text-base font-semibold text-slate-900">{role.label}</span>
                <span className="mt-0.5 block text-sm text-slate-500">{role.description}</span>
              </span>
            </button>
          );
        })}

        <a
          href="/menu"
          className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ background: "#475569" }}
          >
            <BookOpen size={20} />
          </span>
          <span>
            <span className="block text-base font-semibold text-slate-900">Cliente / Menú</span>
            <span className="mt-0.5 block text-sm text-slate-500">Ver el menú del restaurante</span>
          </span>
        </a>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {!confirmingReset ? (
          <button
            type="button"
            onClick={() => setConfirmingReset(true)}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw size={16} />
            Restablecer demo
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            <span>¿Borrar todo y volver al estado inicial?</span>
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              className="flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {resetting && <Loader2 size={12} className="animate-spin" />}
              Sí, restablecer
            </button>
            <button
              type="button"
              onClick={() => setConfirmingReset(false)}
              disabled={resetting}
              className="text-xs font-semibold text-amber-700 hover:underline"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {resetMessage && <p className="mt-3 text-sm text-slate-500">{resetMessage}</p>}

      <p className="mt-8 max-w-md text-center text-xs text-slate-400">
        Es un proyecto de portfolio: no hay contraseñas reales, elegís un rol y entrás directo a esa vista.
        Los datos son ficticios y se guardan en una base de datos de demo.
      </p>
    </div>
  );
}
