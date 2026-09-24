"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatDdMmYyyy(date) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function sameDay(a, b) {
  return (
    a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

// Grilla de 6 semanas empezando el lunes, con los días de los meses
// adyacentes atenuados para completar la grilla.
function buildMonthGrid(viewMonth) {
  const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - offset);

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

// Calendario propio en vez de <input type="date"> nativo: ese input se
// muestra en mm/dd/yyyy o dd/mm/yyyy según el idioma del navegador (no de la
// página), así que no hay forma de garantizar día/mes/año con un input nativo.
export default function DatePicker({ value, onChange, placeholder = "dd/mm/aaaa" }) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(value || new Date());
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    function handleEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const days = buildMonthGrid(viewMonth);
  const monthLabel = viewMonth.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  function changeMonth(delta) {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1));
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setViewMonth(value || new Date());
          setOpen((o) => !o);
        }}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
      >
        <span className={value ? "text-slate-900" : "text-slate-400"}>{value ? formatDdMmYyyy(value) : placeholder}</span>
        <Calendar size={15} className="text-slate-400" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-semibold capitalize text-slate-700">{monthLabel}</span>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-slate-400">
            {WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((d) => {
              const inMonth = d.getMonth() === viewMonth.getMonth();
              const selected = sameDay(d, value);
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  onClick={() => {
                    onChange(d);
                    setOpen(false);
                  }}
                  className={`rounded-lg py-1 text-xs transition ${
                    selected
                      ? "bg-orange-600 font-semibold text-white"
                      : inMonth
                        ? "text-slate-700 hover:bg-orange-50"
                        : "text-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
