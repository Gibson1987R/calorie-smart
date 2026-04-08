import { guardarConsumo, guardarMeta, supabaseConfigurado } from "./supabaseClient";

const PERFIL_KEY = "calorie-smart:perfil";
const CONSUMOS_KEY = "calorie-smart:consumos";
const USER_KEY = "calorie-smart:user-id";

function obtenerStorage() {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  return window.localStorage;
}

function generarId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `user-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function obtenerUserId() {
  const storage = obtenerStorage();
  if (!storage) return generarId();

  const userIdGuardado = storage.getItem(USER_KEY);
  if (userIdGuardado) return userIdGuardado;

  const nuevoUserId = generarId();
  storage.setItem(USER_KEY, nuevoUserId);
  return nuevoUserId;
}

export function cargarDatosIniciales(perfilFallback, consumosFallback) {
  try {
    const storage = obtenerStorage();
    if (!storage) {
      return {
        perfil: perfilFallback,
        consumos: consumosFallback,
      };
    }

    obtenerUserId();
    const perfilGuardado = JSON.parse(storage.getItem(PERFIL_KEY) || "null");
    const consumosGuardados = JSON.parse(storage.getItem(CONSUMOS_KEY) || "null");

    return {
      perfil: perfilGuardado || perfilFallback,
      consumos: consumosGuardados || consumosFallback,
    };
  } catch {
    return {
      perfil: perfilFallback,
      consumos: consumosFallback,
    };
  }
}

export async function persistirPerfilYMeta({
  perfil,
  tmb,
  metaDiaria,
  onStatusChange,
}) {
  const storage = obtenerStorage();
  if (storage) {
    storage.setItem(PERFIL_KEY, JSON.stringify(perfil));
  }

  if (!supabaseConfigurado) {
    onStatusChange("Guardado local");
    return;
  }

  onStatusChange("Sincronizando perfil...");

  try {
    await guardarMeta({
      user_id: obtenerUserId(),
      ...perfil,
      tmb,
      meta_diaria: metaDiaria,
    });
    onStatusChange("Supabase conectado");
  } catch {
    onStatusChange("Guardado local con fallo remoto");
  }
}

export async function persistirConsumo(consumo, onStatusChange) {
  const storage = obtenerStorage();
  const consumosActuales = storage
    ? JSON.parse(storage.getItem(CONSUMOS_KEY) || "[]")
    : [];

  if (storage) {
    storage.setItem(CONSUMOS_KEY, JSON.stringify([consumo, ...consumosActuales]));
  }

  if (!supabaseConfigurado) {
    onStatusChange("Consumo guardado localmente");
    return;
  }

  onStatusChange("Sincronizando consumo...");

  try {
    await guardarConsumo({
      user_id: obtenerUserId(),
      fecha: consumo.fecha,
      momento: consumo.momento,
      nombre_comida: consumo.nombre,
      calorias_estimadas: consumo.calorias,
      fuente_calculo: "manual",
    });
    onStatusChange("Consumo sincronizado");
  } catch {
    onStatusChange("Consumo local; fallo al sincronizar");
  }
}
