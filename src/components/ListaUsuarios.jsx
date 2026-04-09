import React, { useState } from "react";

export default function ListaUsuarios({
  usuarios,
  usuarioSeleccionadoId,
  onSeleccionarUsuario,
  onAjustarMeta,
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-slate-900 p-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold text-white">Lista administrativa de usuarios</h2>
        <p className="text-sm text-slate-400">
          Naranja: no registraron ayer. Rojo: superaron la meta del dia. Al tocar un nombre se actualiza el dashboard inferior.
        </p>
      </div>

      <div className="mt-6 space-y-5">
        <BloqueUsuarios
          titulo="1. Sin registro en el dia anterior"
          usuarios={usuarios.filter((usuario) => usuario.resumen.estado === "sin_registro")}
          color="orange"
          usuarioSeleccionadoId={usuarioSeleccionadoId}
          onSeleccionarUsuario={onSeleccionarUsuario}
        />

        <BloqueUsuarios
          titulo="2. Superaron su meta del dia"
          usuarios={usuarios.filter((usuario) => usuario.resumen.estado === "exceso")}
          color="red"
          usuarioSeleccionadoId={usuarioSeleccionadoId}
          onSeleccionarUsuario={onSeleccionarUsuario}
          onAjustarMeta={onAjustarMeta}
        />

        <BloqueUsuarios
          titulo="3. Dentro de seguimiento"
          usuarios={usuarios.filter((usuario) => usuario.resumen.estado === "ok")}
          color="slate"
          usuarioSeleccionadoId={usuarioSeleccionadoId}
          onSeleccionarUsuario={onSeleccionarUsuario}
        />
      </div>
    </section>
  );
}

function BloqueUsuarios({
  titulo,
  usuarios,
  color,
  usuarioSeleccionadoId,
  onSeleccionarUsuario,
  onAjustarMeta,
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
        {titulo}
      </h3>
      {usuarios.length ? (
        usuarios.map((usuario) => (
          <FilaUsuario
            key={usuario.id}
            usuario={usuario}
            color={color}
            activa={usuario.id === usuarioSeleccionadoId}
            onSeleccionar={() => onSeleccionarUsuario(usuario.id)}
            onAjustarMeta={onAjustarMeta}
          />
        ))
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 bg-slate-800/40 px-4 py-4 text-sm text-slate-400">
          Sin usuarios en este bloque.
        </div>
      )}
    </div>
  );
}

function FilaUsuario({ usuario, color, activa, onSeleccionar, onAjustarMeta }) {
  const [nuevaMeta, setNuevaMeta] = useState(
    usuario.metaPersonalizada || usuario.resumen.metaActiva
  );
  const nombreCompleto = `${usuario.nombre} ${usuario.apellidos || ""}`.trim();

  const colorStyles = {
    orange: "border-orange-400/25 bg-orange-400/10",
    red: "border-rose-500/30 bg-rose-500/10",
    slate: "border-white/10 bg-slate-800/60",
  };

  return (
    <button
      type="button"
      onClick={onSeleccionar}
      className={`w-full rounded-3xl border p-4 text-left transition ${colorStyles[color]} ${
        activa ? "ring-2 ring-cyan-400/70" : "hover:border-white/20"
      }`}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-1">
          <p className="text-lg font-semibold text-white">{nombreCompleto}</p>
          <p className="text-sm text-slate-300">{usuario.email}</p>
          <p className="text-sm text-slate-300">
            Ayer: {usuario.resumen.caloriasAyer} kcal | Hoy: {usuario.resumen.caloriasHoy} kcal | Meta actual: {Math.round(usuario.resumen.metaActiva)} kcal
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            {usuario.resumen.mensaje}
          </p>
        </div>

        {color === "red" ? (
          <div
            className="grid gap-2 sm:grid-cols-[1fr_auto]"
            onClick={(event) => event.stopPropagation()}
          >
            <input
              type="number"
              value={nuevaMeta}
              min="1200"
              onChange={(event) => setNuevaMeta(event.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
            />
            <button
              type="button"
              onClick={() => onAjustarMeta(usuario.id, Number(nuevaMeta))}
              className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              Setear meta
            </button>
          </div>
        ) : null}
      </div>
    </button>
  );
}
