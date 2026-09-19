import { formatCurrency } from "@/lib/format";

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function WeekChart({ days }) {
  const max = Math.max(1, ...days.map((d) => Math.max(d.sales, d.expenses)));

  return (
    <div>
      <div className="flex items-end gap-3 sm:gap-5" style={{ height: 160 }}>
        {days.map((d) => {
          const date = new Date(`${d.date}T00:00:00`);
          const salesHeight = Math.max(4, Math.round((d.sales / max) * 140));
          const expensesHeight = Math.max(4, Math.round((d.expenses / max) * 140));
          return (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-[140px] items-end gap-1">
                <div
                  className="w-3 rounded-t bg-orange-500 sm:w-4"
                  style={{ height: salesHeight }}
                  title={`Ventas: ${formatCurrency(d.sales)}`}
                />
                <div
                  className="w-3 rounded-t bg-slate-300 sm:w-4"
                  style={{ height: expensesHeight }}
                  title={`Gastos: ${formatCurrency(d.expenses)}`}
                />
              </div>
              <span className="text-[11px] font-medium text-slate-400">{WEEKDAYS[date.getDay()]}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-orange-500" /> Ventas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-300" /> Gastos
        </span>
      </div>
    </div>
  );
}
