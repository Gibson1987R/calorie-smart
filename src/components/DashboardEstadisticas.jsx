import React from "react";

const nombresDia = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
  "Domingo",
];

export default function DashboardEstadisticas({
  planSemanal,
  consumos,
  metaDiaria,
}) {
  return (
    <section className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[1.75rem] border border-white/10 bg-slate-900 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              Dashboard comparativo estilo Excel
            </h2>
            <p className="text-sm text-slate-400">
              Proyectado vs real consumido con meta ajustada y calorias restantes.
            </p>
          </div>
          <span className="rounded-full border border-orange-400/20 bg-orange-400/10 px-4 py-1 text-sm text-orange-200">
            Meta base: {Math.round(metaDiaria)} kcal
          </span>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="px-4">Dia</th>
                <th className="px-4">Fecha</th>
                <th className="px-4">Meta proyectada</th>
                <th className="px-4">Meta ajustada</th>
                <th className="px-4">Real consumido</th>
                <th className="px-4">Balance</th>
              </tr>
            </thead>
            <tbody>
              {planSemanal.map((dia, index) => (
                <tr key={dia.fecha} className="rounded-2xl bg-slate-800/70">
                  <td className="rounded-l-2xl px-4 py-4 font-medium text-white">
                    {nombresDia[index]}
                  </td>
                  <td className="px-4 py-4 text-slate-300">{dia.fecha}</td>
                  <td className="px-4 py-4 text-slate-300">
                    {Math.round(dia.metaOriginal)} kcal
                  </td>
                  <td className="px-4 py-4 text-emerald-300">
                    {Math.round(dia.metaAjustada)} kcal
                  </td>
                  <td className="px-4 py-4 text-slate-200">
                    {Math.round(dia.consumido)} kcal
                  </td>
                  <td
                    className={`rounded-r-2xl px-4 py-4 font-semibold ${
                      dia.restante >= 0 ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    {Math.round(dia.restante)} kcal
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-slate-900 p-6">
        <h2 className="text-xl font-bold text-white">Timeline de consumos</h2>
        <p className="mt-2 text-sm text-slate-400">
          Vista operativa para revisar las eventualidades que disparan la
          redistribucion automatica.
        </p>

        <div className="mt-6 space-y-3">
          {consumos.map((consumo) => (
            <div
              key={consumo.id}
              className="rounded-2xl border border-white/10 bg-slate-800/70 p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-white">{consumo.nombre}</p>
                  <p className="text-sm text-slate-400">
                    {consumo.fecha} | {consumo.momento}
                  </p>
                </div>
                <span className="text-sm font-semibold text-orange-300">
                  {consumo.calorias} kcal
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
