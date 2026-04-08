import React, { useEffect, useMemo, useState } from "react";
import FormularioComida from "./components/FormularioComida.jsx";
import DashboardEstadisticas from "./components/DashboardEstadisticas.jsx";
import {
  ACTIVIDAD_FACTORES,
  OBJETIVO_AJUSTES,
  agruparConsumosPorFecha,
  construirPlanSemanal,
  calcularMetaDiaria,
  calcularTMB,
  sugerirMenuDiario,
} from "./lib/calorias";
import {
  cargarDatosIniciales,
  persistirConsumo,
  persistirPerfilYMeta,
} from "./lib/storage";

const perfilInicial = {
  peso: 70,
  altura: 170,
  edad: 30,
  sexo: "masculino",
  actividad: "moderado",
  objetivo: "mantener",
};

const consumosDemo = [
  {
    id: 1,
    fecha: "2026-04-06",
    momento: "almuerzo",
    nombre: "2 platanos fritos y 5 huevos",
    calorias: 890,
  },
  {
    id: 2,
    fecha: "2026-04-06",
    momento: "cena",
    nombre: "2 tequenos",
    calorias: 280,
  },
  {
    id: 3,
    fecha: "2026-04-07",
    momento: "desayuno",
    nombre: "Avena con yogur griego",
    calorias: 420,
  },
];

export default function App() {
  const datosIniciales = useMemo(
    () => cargarDatosIniciales(perfilInicial, consumosDemo),
    []
  );
  const [perfil, setPerfil] = useState(datosIniciales.perfil);
  const [consumos, setConsumos] = useState(datosIniciales.consumos);
  const [resumenMenu, setResumenMenu] = useState([]);
  const [estadoSync, setEstadoSync] = useState("Listo");

  const tmb = useMemo(() => calcularTMB(perfil), [perfil]);
  const metaDiaria = useMemo(() => calcularMetaDiaria(perfil), [perfil]);
  const consumoPorFecha = useMemo(
    () => agruparConsumosPorFecha(consumos),
    [consumos]
  );

  const planSemanal = useMemo(
    () => construirPlanSemanal(metaDiaria, consumoPorFecha),
    [metaDiaria, consumoPorFecha]
  );

  const caloriasDisponiblesHoy = useMemo(() => {
    const hoy = new Date().toISOString().slice(0, 10);
    const diaActual = planSemanal.find((dia) => dia.fecha === hoy);
    return diaActual ? Math.max(diaActual.restante, 0) : metaDiaria;
  }, [metaDiaria, planSemanal]);

  useEffect(() => {
    setResumenMenu(sugerirMenuDiario(caloriasDisponiblesHoy));
  }, [caloriasDisponiblesHoy]);

  useEffect(() => {
    persistirPerfilYMeta({
      perfil,
      tmb,
      metaDiaria,
      onStatusChange: setEstadoSync,
    });
  }, [perfil, tmb, metaDiaria]);

  const handlePerfilChange = (event) => {
    const { name, value } = event.target;
    setPerfil((prev) => ({
      ...prev,
      [name]: ["peso", "altura", "edad"].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const handleAgregarComida = (nuevaComida) => {
    const consumoNormalizado = {
      id: Date.now(),
      ...nuevaComida,
      calorias: Number(nuevaComida.calorias),
    };

    setConsumos((prev) => [consumoNormalizado, ...prev]);
    persistirConsumo(consumoNormalizado, setEstadoSync);
  };

  const resumenSemanal = useMemo(() => {
    const consumido = planSemanal.reduce((sum, dia) => sum + dia.consumido, 0);
    const proyectado = planSemanal.reduce(
      (sum, dia) => sum + dia.metaOriginal,
      0
    );
    const ajustado = planSemanal.reduce((sum, dia) => sum + dia.metaAjustada, 0);

    return {
      consumido,
      proyectado,
      ajustado,
      balance: ajustado - consumido,
    };
  }, [planSemanal]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-emerald-500/15 via-slate-900 to-orange-400/10 p-8 shadow-2xl shadow-emerald-950/30 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1 text-sm font-medium text-emerald-200">
              Landing de registro y optimizacion calorica
            </span>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white md:text-6xl">
                Controla tu semana calorica con reajustes automaticos y sugerencias inteligentes.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
                Esta interfaz combina perfil metabolico, registro de comidas,
                presupuesto semanal y una vista operativa estilo Excel para
                reaccionar a excesos sin perder el objetivo.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard
                label="TMB"
                value={`${Math.round(tmb)} kcal`}
                detail="Mifflin-St Jeor"
              />
              <MetricCard
                label="Meta diaria"
                value={`${Math.round(metaDiaria)} kcal`}
                detail={`${perfil.objetivo} | ${OBJETIVO_AJUSTES[perfil.objetivo]} kcal`}
              />
              <MetricCard
                label="Actividad"
                value={perfil.actividad}
                detail={`Factor ${ACTIVIDAD_FACTORES[perfil.actividad]}`}
              />
            </div>
            <p className="text-sm text-slate-400">
              Persistencia: <span className="text-emerald-300">{estadoSync}</span>
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/70 p-6 backdrop-blur">
            <h2 className="text-xl font-bold text-white">Perfil del usuario</h2>
            <p className="mt-2 text-sm text-slate-400">
              Ajusta peso, altura, edad, sexo, actividad y objetivo para
              recalcular automaticamente el presupuesto semanal.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <CampoPerfil
                label="Peso (kg)"
                name="peso"
                type="number"
                value={perfil.peso}
                onChange={handlePerfilChange}
              />
              <CampoPerfil
                label="Altura (cm)"
                name="altura"
                type="number"
                value={perfil.altura}
                onChange={handlePerfilChange}
              />
              <CampoPerfil
                label="Edad"
                name="edad"
                type="number"
                value={perfil.edad}
                onChange={handlePerfilChange}
              />
              <SelectPerfil
                label="Sexo"
                name="sexo"
                value={perfil.sexo}
                onChange={handlePerfilChange}
                options={[
                  { label: "Masculino", value: "masculino" },
                  { label: "Femenino", value: "femenino" },
                ]}
              />
              <SelectPerfil
                label="Actividad"
                name="actividad"
                value={perfil.actividad}
                onChange={handlePerfilChange}
                options={[
                  { label: "Sedentario", value: "sedentario" },
                  { label: "Ligero", value: "ligero" },
                  { label: "Moderado", value: "moderado" },
                  { label: "Activo", value: "activo" },
                  { label: "Muy activo", value: "muy_activo" },
                ]}
              />
              <SelectPerfil
                label="Objetivo"
                name="objetivo"
                value={perfil.objetivo}
                onChange={handlePerfilChange}
                options={[
                  { label: "Perder", value: "perder" },
                  { label: "Mantener", value: "mantener" },
                  { label: "Aumentar", value: "aumentar" },
                ]}
              />
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <FormularioComida onAgregarComida={handleAgregarComida} />

          <aside className="space-y-6">
            <div className="rounded-[1.75rem] border border-white/10 bg-slate-900 p-6">
              <h2 className="text-xl font-bold text-white">Resumen semanal</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Proyectado"
                  value={`${Math.round(resumenSemanal.proyectado)} kcal`}
                  detail="Antes de redistribuir"
                />
                <MetricCard
                  label="Ajustado"
                  value={`${Math.round(resumenSemanal.ajustado)} kcal`}
                  detail="Meta tras eventualidades"
                />
                <MetricCard
                  label="Consumido"
                  value={`${Math.round(resumenSemanal.consumido)} kcal`}
                  detail="Suma real registrada"
                />
                <MetricCard
                  label="Balance"
                  value={`${Math.round(resumenSemanal.balance)} kcal`}
                  detail={
                    resumenSemanal.balance >= 0 ? "Margen disponible" : "Exceso semanal"
                  }
                />
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-slate-900 p-6">
              <h2 className="text-xl font-bold text-white">
                Menu sugerido para hoy
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Ajustado a {Math.round(caloriasDisponiblesHoy)} kcal restantes.
              </p>
              <div className="mt-4 space-y-3">
                {resumenMenu.map((item) => (
                  <div
                    key={item.nombre}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-white">{item.nombre}</p>
                      <p className="text-sm text-slate-400">{item.tipo}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-300">
                      {item.calorias} kcal
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <DashboardEstadisticas
          planSemanal={planSemanal}
          consumos={consumos}
          metaDiaria={metaDiaria}
        />
      </div>
    </div>
  );
}

function MetricCard({ label, value, detail }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{detail}</p>
    </div>
  );
}

function CampoPerfil({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
      <input
        {...props}
        className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
      />
    </label>
  );
}

function SelectPerfil({ label, options, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
      <select
        {...props}
        className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
