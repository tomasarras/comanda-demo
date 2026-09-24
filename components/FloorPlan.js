"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus, X } from "lucide-react";

const MIN_CAPACITY = 1;
const MAX_CAPACITY = 20;

const MIN_POS = 6;
const MAX_POS = 94;

const STATUS_LABELS = {
  available: "Disponible",
  occupied: "Ocupada",
  reserved: "Reserva próxima",
};

const STATUS_CLASSES = {
  available: "border-emerald-400 bg-emerald-50 text-emerald-700 hover:border-emerald-500",
  occupied: "border-rose-400 bg-rose-100 text-rose-700",
  reserved: "border-amber-400 bg-amber-100 text-amber-700",
};

function clamp(n) {
  return Math.min(MAX_POS, Math.max(MIN_POS, n));
}

// Mapa visual del salón: un rectángulo con las mesas ubicadas por posición
// (posX/posY en porcentaje). En modo "edit" las mesas se arrastran con
// Pointer Events; en modo "select" son botones para elegir una mesa libre.
export default function FloorPlan({
  tables,
  mode = "select",
  selectedId = null,
  onSelect,
  onMove,
  onDelete,
  onCapacityChange,
  onNumberChange,
}) {
  const containerRef = useRef(null);
  const [dragId, setDragId] = useState(null);
  const [dragPos, setDragPos] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editingNumberId, setEditingNumberId] = useState(null);
  const [numberDraft, setNumberDraft] = useState("");

  // Confirmación en dos pasos (sin window.confirm, que bloquea la página):
  // el primer click arma el borrado, el segundo lo ejecuta; se desarma solo.
  useEffect(() => {
    if (!confirmDeleteId) return;
    const timer = setTimeout(() => setConfirmDeleteId(null), 3000);
    return () => clearTimeout(timer);
  }, [confirmDeleteId]);

  function handleDeleteClick(table) {
    if (confirmDeleteId === table.id) {
      setConfirmDeleteId(null);
      onDelete?.(table);
    } else {
      setConfirmDeleteId(table.id);
    }
  }

  function startEditNumber(table) {
    setEditingNumberId(table.id);
    setNumberDraft(String(table.number));
  }

  function commitEditNumber(table) {
    const parsed = parseInt(numberDraft, 10);
    setEditingNumberId(null);
    if (Number.isInteger(parsed) && parsed > 0 && parsed !== table.number) {
      onNumberChange?.(table, parsed);
    }
  }

  function positionOf(table) {
    if (dragId === table.id && dragPos) return dragPos;
    return { posX: table.posX, posY: table.posY };
  }

  function handlePointerDown(e, table) {
    if (mode !== "edit") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragId(table.id);
    setDragPos({ posX: table.posX, posY: table.posY });
  }

  function handlePointerMove(e) {
    if (mode !== "edit" || !dragId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const posX = clamp(((e.clientX - rect.left) / rect.width) * 100);
    const posY = clamp(((e.clientY - rect.top) / rect.height) * 100);
    setDragPos({ posX, posY });
  }

  function handlePointerUp() {
    if (mode !== "edit" || !dragId) return;
    onMove?.(dragId, dragPos.posX, dragPos.posY);
    setDragId(null);
    setDragPos(null);
  }

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="relative aspect-video w-full touch-none rounded-2xl border border-slate-200 bg-slate-50"
    >
      {tables.length === 0 && (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
          No hay mesas cargadas.
        </p>
      )}

      {tables.map((table) => {
        const { posX, posY } = positionOf(table);
        // En modo "select" solo bloqueamos si hay una orden todavía en curso
        // de cocina — una mesa con únicamente una orden ENTREGADA (esperando
        // el cobro combinado) sigue disponible para pedir otra ronda.
        const occupied = mode === "select" ? Boolean(table.hasOpenOrder) : Boolean(table.activeOrder);
        const selected = selectedId === table.id;

        return (
          <div
            key={table.id}
            style={{ left: `${posX}%`, top: `${posY}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
          >
            <div
              role="button"
              tabIndex={0}
              onPointerDown={(e) => handlePointerDown(e, table)}
              onClick={() => {
                if (mode === "select" && !occupied) onSelect?.(table.id);
                if (mode === "view") onSelect?.(table.id);
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                if ((mode === "select" && !occupied) || mode === "view") {
                  e.preventDefault();
                  onSelect?.(table.id);
                }
              }}
              aria-disabled={mode === "select" && occupied}
              title={
                mode === "view"
                  ? `Mesa ${table.number} · ${STATUS_LABELS[table.status] || ""}`
                  : occupied
                    ? `Mesa ${table.number} · ocupada`
                    : table.status === "reserved"
                      ? `Mesa ${table.number} · reserva próxima`
                      : `Mesa ${table.number}`
              }
              className={`flex h-14 w-14 flex-col items-center justify-center rounded-xl border-2 text-xs font-semibold shadow-sm outline-none transition ${
                mode === "edit" ? "cursor-grab active:cursor-grabbing" : ""
              } ${mode === "view" ? "cursor-pointer " + (STATUS_CLASSES[table.status] || STATUS_CLASSES.available) : ""} ${
                mode === "view"
                  ? ""
                  : selected
                    ? "border-orange-600 bg-orange-600 text-white"
                    : occupied
                      ? "cursor-not-allowed border-slate-200 bg-slate-200 text-slate-400"
                      : table.status === "reserved"
                        ? "border-amber-400 bg-amber-50 text-amber-700 hover:border-amber-500"
                        : "border-slate-300 bg-white text-slate-700 hover:border-orange-400"
              }`}
            >
              {mode === "edit" && editingNumberId === table.id ? (
                <span onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                  Mesa{" "}
                  <input
                    type="number"
                    autoFocus
                    value={numberDraft}
                    onChange={(e) => setNumberDraft(e.target.value)}
                    onBlur={() => commitEditNumber(table)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") setEditingNumberId(null);
                    }}
                    className="w-8 rounded border border-orange-400 px-0.5 text-center text-xs font-semibold text-slate-900 outline-none"
                  />
                </span>
              ) : (
                <span
                  onPointerDown={(e) => mode === "edit" && e.stopPropagation()}
                  onClick={(e) => {
                    if (mode !== "edit") return;
                    e.stopPropagation();
                    startEditNumber(table);
                  }}
                  title={mode === "edit" ? "Click para cambiar el número" : undefined}
                >
                  Mesa {table.number}
                </span>
              )}
              {mode === "edit" ? (
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCapacityChange?.(table, Math.max(MIN_CAPACITY, table.capacity - 1));
                    }}
                    title="Menos personas"
                    className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                  >
                    <Minus size={8} />
                  </button>
                  <span className="text-[10px] font-normal opacity-70">{table.capacity}p</span>
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCapacityChange?.(table, Math.min(MAX_CAPACITY, table.capacity + 1));
                    }}
                    title="Más personas"
                    className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                  >
                    <Plus size={8} />
                  </button>
                </span>
              ) : (
                <span className="text-[10px] font-normal opacity-70">{table.capacity}p</span>
              )}
            </div>

            {mode === "edit" && (
              <button
                type="button"
                onClick={() => handleDeleteClick(table)}
                title={confirmDeleteId === table.id ? "Confirmar eliminar" : "Eliminar mesa"}
                className={`absolute -right-1.5 -top-1.5 flex items-center justify-center rounded-full shadow ring-1 transition ${
                  confirmDeleteId === table.id
                    ? "h-auto min-w-[3.25rem] gap-1 px-1.5 py-0.5 text-[10px] font-semibold bg-rose-600 text-white ring-rose-600"
                    : "h-5 w-5 bg-white text-slate-400 ring-slate-200 hover:text-rose-600"
                }`}
              >
                {confirmDeleteId === table.id ? "¿Seguro?" : <X size={12} />}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
