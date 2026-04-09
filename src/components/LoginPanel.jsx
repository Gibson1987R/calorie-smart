import React, { useState } from "react";

export default function LoginPanel({ onLogin, mensaje }) {
  const [credenciales, setCredenciales] = useState({
    email: "admin@calorie.app",
    password: "admin123",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCredenciales((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onLogin(credenciales);
  };

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6">
      <h2 className="text-2xl font-bold text-white">Login</h2>
      <p className="mt-2 text-sm text-slate-400">
        Entra como usuario comun o administrador para probar los permisos.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">Correo</span>
          <input
            type="email"
            name="email"
            value={credenciales.email}
            onChange={handleChange}
            className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">Clave</span>
          <input
            type="password"
            name="password"
            value={credenciales.password}
            onChange={handleChange}
            className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
          />
        </label>

        {mensaje ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {mensaje}
          </div>
        ) : null}

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
        >
          Iniciar sesion
        </button>
      </form>
    </section>
  );
}
