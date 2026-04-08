import React, { useState } from "react";

const estadoInicial = {
  fecha: new Date().toISOString().slice(0, 10),
  momento: "desayuno",
  nombre: "",
  calorias: "",
};

export default function FormularioComida({ onAgregarComida }) {
  const [formData, setFormData] = useState(estadoInicial);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formData.nombre.trim() || !formData.calorias) return;

    onAgregarComida(formData);
    setFormData((prev) => ({
      ...estadoInicial,
      fecha: prev.fecha,
      momento: prev.momento,
    }));
  };

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-slate-900 p-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold text-white">Registro de comidas</h2>
        <p className="text-sm text-slate-400">
          Registra nombre, calorias estimadas, fecha y momento del dia para
          alimentar el algoritmo de presupuesto semanal.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Fecha</span>
            <input
              type="date"
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
              className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none focus:border-emerald-400"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Momento
            </span>
            <select
              name="momento"
              value={formData.momento}
              onChange={handleChange}
              className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none focus:border-emerald-400"
            >
              <option value="desayuno">Desayuno</option>
              <option value="almuerzo">Almuerzo</option>
              <option value="cena">Cena</option>
              <option value="snack">Snack</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">
            Nombre de la comida
          </span>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ej: 2 platanos fritos y 5 huevos"
            className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none focus:border-emerald-400"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">
            Calorias estimadas
          </span>
          <input
            type="number"
            name="calorias"
            value={formData.calorias}
            onChange={handleChange}
            placeholder="650"
            min="0"
            className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none focus:border-emerald-400"
          />
        </label>

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
        >
          Guardar consumo
        </button>
      </form>
    </section>
  );
}
