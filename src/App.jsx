import React, { useEffect, useMemo, useState } from "react";
import FormularioComida from "./components/FormularioComida.jsx";
import DashboardEstadisticas from "./components/DashboardEstadisticas.jsx";
import LoginPanel from "./components/LoginPanel.jsx";
import ListaUsuarios from "./components/ListaUsuarios.jsx";
import {
  ACTIVIDAD_FACTORES,
  OBJETIVO_AJUSTES,
  agruparConsumosPorFecha,
  construirPlanSemanal,
  calcularMetaDiaria,
  calcularTMB,
  generarMenusInteligentes,
  obtenerFechaLocal,
  obtenerResumenUsuario,
} from "./lib/calorias";
import {
  autenticarUsuario,
  cargarEstadoAplicacion,
  persistirAppState,
} from "./lib/storage";
import {
  auth,
  firebaseConfigurado,
  loginConGoogle,
  logoutFirebase,
  observarAuth,
} from "./lib/firebase";
import {
  actualizarMetaFirebase,
  asegurarUsuarioFirebase,
  cargarUsuariosFirebase,
  guardarUsuarioFirebase,
  seedUsuariosDemoSiHaceFalta,
} from "./lib/firebaseData";

export default function App() {
  const estadoInicial = useMemo(() => cargarEstadoAplicacion(), []);
  const [usuarios, setUsuarios] = useState(estadoInicial.usuarios);
  const [sesion, setSesion] = useState(estadoInicial.sesion);
  const [usuarioSeleccionadoId, setUsuarioSeleccionadoId] = useState(
    estadoInicial.usuarioSeleccionadoId
  );
  const [estadoSync, setEstadoSync] = useState("Listo");
  const [mensajeLogin, setMensajeLogin] = useState("");
  const [prefillComida, setPrefillComida] = useState(null);
  const [cargandoRemoto, setCargandoRemoto] = useState(false);

  useEffect(() => {
    persistirAppState({
      usuarios,
      sesion,
      usuarioSeleccionadoId,
      onStatusChange: setEstadoSync,
    });
  }, [usuarios, sesion, usuarioSeleccionadoId]);

  useEffect(() => {
    if (!firebaseConfigurado || !auth) return undefined;

    const unsubscribe = observarAuth(async (firebaseUser) => {
      if (!firebaseUser) return;

      setCargandoRemoto(true);
      try {
        await asegurarUsuarioFirebase(firebaseUser);
        await seedUsuariosDemoSiHaceFalta();
        const remotos = await cargarUsuariosFirebase();
        if (remotos.length) {
          setUsuarios(remotos);
        }
        setSesion({
          userId: firebaseUser.uid,
          rol: remotos.find((usuario) => usuario.id === firebaseUser.uid)?.rol || "usuario",
        });
        setEstadoSync("Firebase conectado");
      } catch {
        setEstadoSync("Firebase conectado con error de sincronizacion");
      } finally {
        setCargandoRemoto(false);
      }
    });

    return unsubscribe;
  }, []);

  const usuarioSesion = useMemo(
    () => usuarios.find((usuario) => usuario.id === sesion?.userId) || null,
    [usuarios, sesion]
  );

  const esAdmin = usuarioSesion?.rol === "admin";

  const usuariosOperativos = useMemo(
    () => usuarios.filter((usuario) => usuario.rol === "usuario"),
    [usuarios]
  );

  useEffect(() => {
    if (!sesion) return;

    if (esAdmin) {
      if (
        !usuarioSeleccionadoId ||
        !usuariosOperativos.some((usuario) => usuario.id === usuarioSeleccionadoId)
      ) {
        setUsuarioSeleccionadoId(usuariosOperativos[0]?.id || null);
      }
      return;
    }

    setUsuarioSeleccionadoId(usuarioSesion?.id || null);
  }, [esAdmin, sesion, usuarioSeleccionadoId, usuarioSesion, usuariosOperativos]);

  const usuarioActivo = useMemo(() => {
    if (!sesion) return null;
    if (esAdmin) {
      return (
        usuariosOperativos.find((usuario) => usuario.id === usuarioSeleccionadoId) ||
        usuariosOperativos[0] ||
        null
      );
    }

    return usuarioSesion;
  }, [esAdmin, sesion, usuarioSeleccionadoId, usuarioSesion, usuariosOperativos]);

  const consumoPorFecha = useMemo(
    () => agruparConsumosPorFecha(usuarioActivo?.consumos || []),
    [usuarioActivo]
  );

  const tmb = useMemo(
    () => (usuarioActivo ? calcularTMB(usuarioActivo.perfil) : 0),
    [usuarioActivo]
  );

  const metaCalculada = useMemo(
    () => (usuarioActivo ? calcularMetaDiaria(usuarioActivo.perfil) : 0),
    [usuarioActivo]
  );

  const metaDiariaActiva = usuarioActivo?.metaPersonalizada || metaCalculada;

  const planSemanal = useMemo(
    () => construirPlanSemanal(metaDiariaActiva || 0, consumoPorFecha),
    [metaDiariaActiva, consumoPorFecha]
  );

  const caloriasDisponiblesHoy = useMemo(() => {
    const hoy = obtenerFechaLocal();
    const diaActual = planSemanal.find((dia) => dia.fecha === hoy);
    return diaActual ? Math.max(diaActual.restante, 0) : metaDiariaActiva;
  }, [metaDiariaActiva, planSemanal]);

  const menusSugeridos = useMemo(
    () =>
      generarMenusInteligentes(
        usuarioActivo,
        metaDiariaActiva || 0,
        caloriasDisponiblesHoy || 0
      ),
    [caloriasDisponiblesHoy, metaDiariaActiva, usuarioActivo]
  );

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

  const usuariosPriorizados = useMemo(
    () =>
      usuariosOperativos
        .map((usuario) => ({
          ...usuario,
          resumen: obtenerResumenUsuario(usuario),
        }))
        .sort((a, b) => a.resumen.prioridad - b.resumen.prioridad),
    [usuariosOperativos]
  );

  const handleLogin = (credenciales) => {
    const resultado = autenticarUsuario(usuarios, credenciales);

    if (!resultado.ok) {
      setMensajeLogin(resultado.message);
      return;
    }

    setSesion({
      userId: resultado.user.id,
      rol: resultado.user.rol,
    });
    setUsuarioSeleccionadoId(
      resultado.user.rol === "admin"
        ? usuariosOperativos[0]?.id || null
        : resultado.user.id
    );
    setMensajeLogin("");
  };

  const handleGoogleLogin = async () => {
    try {
      setCargandoRemoto(true);
      const firebaseUser = await loginConGoogle();
      await asegurarUsuarioFirebase(firebaseUser);
      await seedUsuariosDemoSiHaceFalta();
      const remotos = await cargarUsuariosFirebase();
      if (remotos.length) {
        setUsuarios(remotos);
      }
      const rol =
        remotos.find((usuario) => usuario.id === firebaseUser.uid)?.rol || "usuario";
      setSesion({
        userId: firebaseUser.uid,
        rol,
      });
      setMensajeLogin("");
      setEstadoSync("Sesion iniciada con Google");
    } catch (error) {
      setMensajeLogin(error.message || "No se pudo iniciar sesion con Google");
    } finally {
      setCargandoRemoto(false);
    }
  };

  const handleLogout = () => {
    if (firebaseConfigurado) {
      logoutFirebase();
    }
    setSesion(null);
    setMensajeLogin("");
  };

  const handlePerfilChange = (event) => {
    const { name, value } = event.target;

    setUsuarios((prev) => {
      const actualizados = prev.map((usuario) => {
        if (usuario.id !== usuarioActivo.id) return usuario;

        return {
          ...usuario,
          perfil: {
            ...usuario.perfil,
            [name]: ["peso", "altura", "edad"].includes(name)
              ? Number(value)
              : value,
          },
        };
      });

      const actualizado = actualizados.find((usuario) => usuario.id === usuarioActivo.id);
      if (firebaseConfigurado && actualizado) {
        guardarUsuarioFirebase(actualizado);
      }

      return actualizados;
    });
  };

  const handleAgregarComida = (nuevaComida) => {
    if (!usuarioActivo) return;

    const consumoNormalizado = {
      id: Date.now(),
      ...nuevaComida,
      calorias: Number(nuevaComida.calorias),
    };

    setUsuarios((prev) => {
      const actualizados = prev.map((usuario) =>
        usuario.id === usuarioActivo.id
          ? {
              ...usuario,
              consumos: [consumoNormalizado, ...usuario.consumos],
          }
          : usuario
      );

      const actualizado = actualizados.find((usuario) => usuario.id === usuarioActivo.id);
      if (firebaseConfigurado && actualizado) {
        guardarUsuarioFirebase(actualizado);
      }

      return actualizados;
    });
    setEstadoSync("Consumo registrado");
    setPrefillComida(null);
  };

  const handleAjustarMeta = (userId, nuevaMeta) => {
    setUsuarios((prev) => {
      const actualizados = prev.map((usuario) =>
        usuario.id === userId
          ? {
              ...usuario,
              metaPersonalizada: Number(nuevaMeta),
          }
          : usuario
      );

      if (firebaseConfigurado) {
        actualizarMetaFirebase(userId, Number(nuevaMeta));
      }

      return actualizados;
    });
    setEstadoSync("Meta actualizada por administrador");
  };

  const nombreCompleto = usuarioActivo
    ? `${usuarioActivo.nombre} ${usuarioActivo.apellidos || ""}`.trim()
    : "";

  if (!sesion) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/15 via-slate-950 to-orange-500/10 p-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-sm font-medium text-cyan-200">
                Control calorico con operacion administrativa
              </span>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight md:text-6xl">
                Una misma landing para pacientes, administrador y seguimiento de metas.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                Inicia sesion como usuario comun o administrador para probar la
                carga de consumos, la lista priorizada y los ajustes de meta
                recomendados por administracion.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard label="Admin demo" value="admin@calorie.app" detail="Clave: admin123" />
                <MetricCard label="Usuario demo" value="laura@calorie.app" detail="Clave: user123" />
                <MetricCard label="Persistencia" value="Local lista" detail={estadoSync} />
              </div>
            </div>

            <LoginPanel
              onLogin={handleLogin}
              onGoogleLogin={handleGoogleLogin}
              mensaje={mensajeLogin}
              firebaseConfigurado={firebaseConfigurado}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-emerald-500/15 via-slate-900 to-orange-400/10 p-8 shadow-2xl shadow-emerald-950/30 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1 text-sm font-medium text-emerald-200">
                Sesion: {usuarioSesion?.rol}
              </span>
              <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-slate-200">
                {usuarioSesion?.nombre}
              </span>
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white md:text-6xl">
                {esAdmin
                  ? "Monitorea pacientes, detecta alertas y corrige metas en tiempo real."
                  : "Registra tu alimentacion y sigue tu meta diaria con ajuste semanal."}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
                {esAdmin
                  ? "La lista prioriza usuarios sin registro ayer y luego quienes superaron su meta hoy. Al seleccionar un nombre, el dashboard inferior carga sus datos."
                  : "Tu panel muestra tu perfil, presupuesto semanal y los consumos registrados para que sigas tu progreso."}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard label="TMB" value={`${Math.round(tmb)} kcal`} detail="Mifflin-St Jeor" />
              <MetricCard
                label="Meta activa"
                value={`${Math.round(metaDiariaActiva || 0)} kcal`}
                detail={
                  usuarioActivo?.metaPersonalizada
                    ? "Meta recomendada por admin"
                    : `${usuarioActivo?.perfil?.objetivo || "mantener"} | ${OBJETIVO_AJUSTES[usuarioActivo?.perfil?.objetivo || "mantener"]} kcal`
                }
              />
              <MetricCard
                label="Actividad"
                value={usuarioActivo?.perfil?.actividad || "-"}
                detail={`Factor ${ACTIVIDAD_FACTORES[usuarioActivo?.perfil?.actividad] || "-"}`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <span>
                Usuario activo: <span className="text-white">{nombreCompleto}</span>
              </span>
              <span>
                Persistencia: <span className="text-emerald-300">{estadoSync}</span>
              </span>
              {cargandoRemoto ? <span>Sincronizando con Firebase...</span> : null}
            </div>
          </div>

          <div className="space-y-6 rounded-[1.75rem] border border-white/10 bg-slate-900/70 p-6 backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-4">
                <img
                  src={usuarioActivo?.foto}
                  alt={nombreCompleto}
                  className="h-20 w-20 rounded-3xl border border-white/10 bg-slate-800 object-cover"
                />
                <div>
                  <h2 className="text-xl font-bold text-white">{nombreCompleto}</h2>
                  <p className="mt-1 text-sm text-slate-300">{usuarioActivo?.email}</p>
                  <p className="text-sm text-slate-400">{usuarioActivo?.telefono}</p>
                  <p className="mt-2 text-sm text-slate-400">
                    {esAdmin
                      ? "Perfil del paciente seleccionado desde la lista administrativa."
                      : "Tu ficha personal y configuracion metabolica."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/5"
              >
                Cerrar sesion
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <CampoPerfil
                label="Peso (kg)"
                name="peso"
                type="number"
                value={usuarioActivo?.perfil?.peso || ""}
                onChange={handlePerfilChange}
              />
              <CampoPerfil
                label="Altura (cm)"
                name="altura"
                type="number"
                value={usuarioActivo?.perfil?.altura || ""}
                onChange={handlePerfilChange}
              />
              <CampoPerfil
                label="Edad"
                name="edad"
                type="number"
                value={usuarioActivo?.perfil?.edad || ""}
                onChange={handlePerfilChange}
              />
              <SelectPerfil
                label="Sexo"
                name="sexo"
                value={usuarioActivo?.perfil?.sexo || "masculino"}
                onChange={handlePerfilChange}
                options={[
                  { label: "Masculino", value: "masculino" },
                  { label: "Femenino", value: "femenino" },
                ]}
              />
              <SelectPerfil
                label="Actividad"
                name="actividad"
                value={usuarioActivo?.perfil?.actividad || "moderado"}
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
                value={usuarioActivo?.perfil?.objetivo || "mantener"}
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

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          {esAdmin ? (
            <ListaUsuarios
              usuarios={usuariosPriorizados}
              usuarioSeleccionadoId={usuarioActivo?.id}
              onSeleccionarUsuario={setUsuarioSeleccionadoId}
              onAjustarMeta={handleAjustarMeta}
            />
          ) : (
            <FormularioComida
              onAgregarComida={handleAgregarComida}
              usuarioActivo={usuarioActivo}
              puedeRegistrar
              prefillComida={prefillComida}
              onConsumirPrefill={() => setPrefillComida(null)}
            />
          )}

          <aside className="space-y-6">
            {esAdmin ? (
              <FormularioComida
                onAgregarComida={handleAgregarComida}
                usuarioActivo={usuarioActivo}
                puedeRegistrar={Boolean(usuarioActivo)}
                prefillComida={prefillComida}
                onConsumirPrefill={() => setPrefillComida(null)}
              />
            ) : null}

            <div className="rounded-[1.75rem] border border-white/10 bg-slate-900 p-6">
              <h2 className="text-xl font-bold text-white">Resumen semanal</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Proyectado" value={`${Math.round(resumenSemanal.proyectado)} kcal`} detail="Antes de redistribuir" />
                <MetricCard label="Ajustado" value={`${Math.round(resumenSemanal.ajustado)} kcal`} detail="Meta tras eventualidades" />
                <MetricCard label="Consumido" value={`${Math.round(resumenSemanal.consumido)} kcal`} detail="Suma real registrada" />
                <MetricCard
                  label="Balance"
                  value={`${Math.round(resumenSemanal.balance)} kcal`}
                  detail={resumenSemanal.balance >= 0 ? "Margen disponible" : "Exceso semanal"}
                />
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-slate-900 p-6">
              <h2 className="text-xl font-bold text-white">Menus sugeridos del paciente</h2>
              <p className="mt-2 text-sm text-slate-400">
                Ajustados al historial de comidas, gustos previos y objetivo calorico recomendado de {nombreCompleto}.
              </p>
              <div className="mt-4 space-y-5">
                {Object.entries(menusSugeridos).map(([momento, opciones]) => (
                  <div key={momento} className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {momento}s sugeridos
                    </h3>
                    {opciones.map((item) => (
                      <button
                        key={`${usuarioActivo?.id}-${momento}-${item.nombre}`}
                        type="button"
                        onClick={() =>
                          setPrefillComida({
                            fecha: obtenerFechaLocal(),
                            momento: item.momento,
                            nombre: item.nombre,
                            calorias: String(item.calorias),
                          })
                        }
                        className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3 text-left transition hover:border-cyan-400/50 hover:bg-slate-800"
                      >
                        <div>
                          <p className="font-medium text-white">{item.nombre}</p>
                          <p className="text-sm text-slate-400">{item.descripcion}</p>
                        </div>
                        <span className="text-sm font-semibold text-emerald-300">
                          {item.calorias} kcal
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <DashboardEstadisticas
          nombreUsuario={nombreCompleto}
          planSemanal={planSemanal}
          consumos={usuarioActivo?.consumos || []}
          metaDiaria={metaDiariaActiva || 0}
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
