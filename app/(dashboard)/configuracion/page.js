"use client";

import { useState } from "react";
import EnviosConfigTab from "@/components/EnviosConfigTab";
import MesasConfigTab from "@/components/MesasConfigTab";
import PersonalConfigTab from "@/components/PersonalConfigTab";

const TABS = [
  { id: "mesas", label: "Mesas" },
  { id: "personal", label: "Personal" },
  { id: "envios", label: "Envíos" },
];

export default function ConfiguracionPage() {
  const [tab, setTab] = useState("mesas");

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Configuración</h1>
      <p className="mt-1 text-sm text-slate-500">Ajustes del local: layout de mesas, personal y envíos.</p>

      <div className="mt-4 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              tab === t.id ? "bg-orange-600 text-white" : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "mesas" && <MesasConfigTab />}
        {tab === "personal" && <PersonalConfigTab />}
        {tab === "envios" && <EnviosConfigTab />}
      </div>
    </div>
  );
}
