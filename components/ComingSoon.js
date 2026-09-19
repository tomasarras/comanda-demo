import { Construction } from "lucide-react";

export default function ComingSoon({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-600">
        <Construction size={22} />
      </span>
      <h1 className="mt-4 text-lg font-bold text-slate-900">{title}</h1>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-orange-600">Próximamente</p>
    </div>
  );
}
