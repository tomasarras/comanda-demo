"use client";

import { useEffect, useState } from "react";
import { Loader2, UserCheck, UserPlus, UserX } from "lucide-react";
import { Skeleton } from "@/components/Skeleton";
import { ROLES, getRole } from "@/lib/roles";

const inputClass =
  "rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";

export default function PersonalConfigTab() {
  const [employees, setEmployees] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(ROLES[0].id);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  function loadEmployees() {
    fetch("/api/employees")
      .then((res) => res.json())
      .then(setEmployees);
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo dar de alta a la persona");
      setEmployees((prev) => [...(prev || []), data]);
      setName("");
      setEmail("");
      setRole(ROLES[0].id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateEmployee(id, patch) {
    setBusyId(id);
    setError("");
    const previous = employees;
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo actualizar");
      setEmployees((prev) => prev.map((e) => (e.id === id ? data : e)));
    } catch (err) {
      setError(err.message);
      setEmployees(previous);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <p className="text-sm text-slate-500">Alta de personal, roles y habilitación de cuentas.</p>

      <form onSubmit={handleCreate} className="mt-4 flex flex-wrap items-end gap-2 rounded-2xl border border-slate-200 bg-white p-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">Nombre</span>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">Email (opcional)</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">Rol</span>
          <select value={role} onChange={(e) => setRole(e.target.value)} className={`bg-white ${inputClass}`}>
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
          Dar de alta
        </button>
      </form>

      {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {!employees ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <UserPlus size={26} className="text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">Todavía no hay personal cargado.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {employees.map((emp) => {
              const empRole = getRole(emp.role);
              const RoleIcon = empRole?.icon;
              return (
                <div
                  key={emp.id}
                  className={`flex flex-wrap items-center justify-between gap-3 p-4 ${!emp.active ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                      style={{ background: empRole?.color || "#94a3b8" }}
                    >
                      {RoleIcon && <RoleIcon size={16} />}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{emp.name}</p>
                      <p className="text-xs text-slate-400">{emp.email || "Sin email"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={emp.role}
                      onChange={(e) => updateEmployee(emp.id, { role: e.target.value })}
                      disabled={busyId === emp.id}
                      className={`bg-white text-xs ${inputClass}`}
                    >
                      {ROLES.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => updateEmployee(emp.id, { active: !emp.active })}
                      disabled={busyId === emp.id}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50 ${
                        emp.active
                          ? "border border-slate-200 text-slate-600 hover:bg-slate-50"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {busyId === emp.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : emp.active ? (
                        <UserX size={13} />
                      ) : (
                        <UserCheck size={13} />
                      )}
                      {emp.active ? "Deshabilitar" : "Habilitar"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
