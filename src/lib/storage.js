import { obtenerFechaLocal } from "./calorias";

const APP_STATE_KEY = "calorie-smart:app-state";

const usuariosDemo = [
  {
    id: "admin-1",
    nombre: "Administrador",
    apellidos: "General",
    email: "admin@calorie.app",
    telefono: "+57 300 000 0000",
    foto: "https://api.dicebear.com/9.x/initials/svg?seed=Administrador%20General",
    password: "admin123",
    rol: "admin",
    perfil: {
      peso: 78,
      altura: 176,
      edad: 39,
      sexo: "masculino",
      actividad: "ligero",
      objetivo: "mantener",
    },
    metaPersonalizada: null,
    consumos: [],
  },
  {
    id: "user-1",
    nombre: "Laura",
    apellidos: "Gomez",
    email: "laura@calorie.app",
    telefono: "+57 301 245 8891",
    foto: "https://api.dicebear.com/9.x/initials/svg?seed=Laura%20Gomez",
    password: "user123",
    rol: "usuario",
    perfil: {
      peso: 64,
      altura: 165,
      edad: 29,
      sexo: "femenino",
      actividad: "moderado",
      objetivo: "perder",
    },
    metaPersonalizada: 1650,
    consumos: [
      {
        id: 101,
        fecha: obtenerFechaLocal(new Date(Date.now() - 2 * 86400000)),
        momento: "almuerzo",
        nombre: "Pasta con pollo",
        calorias: 760,
      },
      {
        id: 102,
        fecha: obtenerFechaLocal(),
        momento: "cena",
        nombre: "Hamburguesa con papas",
        calorias: 1280,
      },
    ],
  },
  {
    id: "user-2",
    nombre: "Carlos",
    apellidos: "Rojas",
    email: "carlos@calorie.app",
    telefono: "+57 315 661 4207",
    foto: "https://api.dicebear.com/9.x/initials/svg?seed=Carlos%20Rojas",
    password: "user123",
    rol: "usuario",
    perfil: {
      peso: 88,
      altura: 180,
      edad: 34,
      sexo: "masculino",
      actividad: "activo",
      objetivo: "mantener",
    },
    metaPersonalizada: null,
    consumos: [
      {
        id: 201,
        fecha: obtenerFechaLocal(new Date(Date.now() - 86400000)),
        momento: "desayuno",
        nombre: "Huevos con tostadas",
        calorias: 480,
      },
      {
        id: 202,
        fecha: obtenerFechaLocal(),
        momento: "almuerzo",
        nombre: "Arroz con carne",
        calorias: 840,
      },
    ],
  },
  {
    id: "user-3",
    nombre: "Mariana",
    apellidos: "Perez",
    email: "mariana@calorie.app",
    telefono: "+57 320 105 7744",
    foto: "https://api.dicebear.com/9.x/initials/svg?seed=Mariana%20Perez",
    password: "user123",
    rol: "usuario",
    perfil: {
      peso: 58,
      altura: 162,
      edad: 26,
      sexo: "femenino",
      actividad: "ligero",
      objetivo: "mantener",
    },
    metaPersonalizada: 1750,
    consumos: [
      {
        id: 301,
        fecha: obtenerFechaLocal(new Date(Date.now() - 86400000)),
        momento: "cena",
        nombre: "Ensalada con salmon",
        calorias: 620,
      },
      {
        id: 302,
        fecha: obtenerFechaLocal(),
        momento: "desayuno",
        nombre: "Yogur con avena",
        calorias: 350,
      },
    ],
  },
];

function obtenerStorage() {
  if (typeof window === "undefined" || !window.localStorage) return null;
  return window.localStorage;
}

function hidratarUsuarios(usuariosGuardados = []) {
  return usuariosDemo.map((baseUsuario) => {
    const guardado = usuariosGuardados.find((usuario) => usuario.id === baseUsuario.id);
    if (!guardado) return baseUsuario;

    return {
      ...baseUsuario,
      ...guardado,
      perfil: {
        ...baseUsuario.perfil,
        ...(guardado.perfil || {}),
      },
      consumos: guardado.consumos || baseUsuario.consumos,
    };
  });
}

export function cargarEstadoAplicacion() {
  try {
    const storage = obtenerStorage();
    const raw = storage?.getItem(APP_STATE_KEY);

    if (!raw) {
      return {
        usuarios: usuariosDemo,
        sesion: null,
        usuarioSeleccionadoId: "user-1",
      };
    }

    const data = JSON.parse(raw);
    return {
      usuarios: hidratarUsuarios(data.usuarios || usuariosDemo),
      sesion: data.sesion || null,
      usuarioSeleccionadoId: data.usuarioSeleccionadoId || "user-1",
    };
  } catch {
    return {
      usuarios: usuariosDemo,
      sesion: null,
      usuarioSeleccionadoId: "user-1",
    };
  }
}

export function persistirAppState({
  usuarios,
  sesion,
  usuarioSeleccionadoId,
  onStatusChange,
}) {
  const storage = obtenerStorage();
  if (!storage) {
    onStatusChange?.("Sesion activa sin persistencia local");
    return;
  }

  storage.setItem(
    APP_STATE_KEY,
    JSON.stringify({
      usuarios,
      sesion,
      usuarioSeleccionadoId,
    })
  );

  onStatusChange?.("Guardado local");
}

export function autenticarUsuario(usuarios, { email, password }) {
  const user = usuarios.find(
    (item) =>
      item.email.toLowerCase() === email.toLowerCase() &&
      item.password === password
  );

  if (!user) {
    return {
      ok: false,
      message:
        "Correo o clave invalida. Prueba admin@calorie.app / admin123 o laura@calorie.app / user123.",
    };
  }

  return {
    ok: true,
    user,
  };
}
