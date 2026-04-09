export const ACTIVIDAD_FACTORES = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  activo: 1.725,
  muy_activo: 1.9,
};

export const OBJETIVO_AJUSTES = {
  perder: -500,
  mantener: 0,
  aumentar: 300,
};

const MINIMO_DIARIO = 1200;

export function obtenerFechaLocal(fecha = new Date()) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function calcularTMB({ peso, altura, edad, sexo }) {
  const base = 10 * peso + 6.25 * altura - 5 * edad;
  return sexo === "femenino" ? base - 161 : base + 5;
}

export function calcularMetaDiaria(perfil) {
  const tmb = calcularTMB(perfil);
  const gasto = tmb * ACTIVIDAD_FACTORES[perfil.actividad];
  return gasto + OBJETIVO_AJUSTES[perfil.objetivo];
}

export function agruparConsumosPorFecha(consumos) {
  return consumos.reduce((acc, consumo) => {
    acc[consumo.fecha] = (acc[consumo.fecha] || 0) + Number(consumo.calorias);
    return acc;
  }, {});
}

function obtenerInicioDeSemana(fechaBase = new Date()) {
  const fecha = new Date(fechaBase);
  const dia = fecha.getDay();
  const diferencia = dia === 0 ? -6 : 1 - dia;
  fecha.setDate(fecha.getDate() + diferencia);
  fecha.setHours(0, 0, 0, 0);
  return fecha;
}

function sumarDias(fecha, cantidad) {
  const nuevaFecha = new Date(fecha);
  nuevaFecha.setDate(nuevaFecha.getDate() + cantidad);
  return nuevaFecha;
}

export function construirPlanSemanal(
  metaDiaria,
  consumoPorFecha,
  fechaBase = new Date()
) {
  const inicioSemana = obtenerInicioDeSemana(fechaBase);
  const planBase = Array.from({ length: 7 }, (_, index) => {
    const fecha = obtenerFechaLocal(sumarDias(inicioSemana, index));
    return {
      fecha,
      metaOriginal: metaDiaria,
      metaAjustada: metaDiaria,
      consumido: consumoPorFecha[fecha] || 0,
      restante: metaDiaria - (consumoPorFecha[fecha] || 0),
    };
  });

  return planBase.reduce((dias, dia, index) => {
    dias[index] = {
      ...dia,
      restante: dia.metaAjustada - dia.consumido,
    };

    if (dias[index].restante < 0 && index < dias.length - 1) {
      const exceso = Math.abs(dias[index].restante);
      const reajustados = redistribuirCalorias(exceso, dias.slice(index + 1));

      reajustados.forEach((reajuste, offset) => {
        const targetIndex = index + 1 + offset;
        dias[targetIndex] = {
          ...dias[targetIndex],
          ...reajuste,
          restante: reajuste.metaAjustada - reajuste.consumido,
        };
      });
    }

    return dias;
  }, [...planBase]);
}

export function redistribuirCalorias(exceso, diasRestantes) {
  if (exceso <= 0 || diasRestantes.length === 0) return diasRestantes;

  const totalMetaDisponible = diasRestantes.reduce(
    (sum, dia) => sum + Math.max(dia.metaAjustada - MINIMO_DIARIO, 0),
    0
  );

  if (totalMetaDisponible <= 0) return diasRestantes;

  let excesoPendiente = exceso;

  const recalculados = diasRestantes.map((dia) => {
    const reducible = Math.max(dia.metaAjustada - MINIMO_DIARIO, 0);
    const reduccionProporcional = (reducible / totalMetaDisponible) * exceso;
    const reduccionAplicada = Math.min(reduccionProporcional, reducible);

    excesoPendiente -= reduccionAplicada;

    return {
      ...dia,
      metaAjustada: dia.metaAjustada - reduccionAplicada,
    };
  });

  if (excesoPendiente > 1) {
    return redistribuirCalorias(excesoPendiente, recalculados);
  }

  return recalculados;
}

export function obtenerResumenUsuario(usuario, fechaBase = new Date()) {
  const hoy = obtenerFechaLocal(fechaBase);
  const ayer = obtenerFechaLocal(sumarDias(fechaBase, -1));
  const consumoPorFecha = agruparConsumosPorFecha(usuario.consumos || []);
  const metaActiva = usuario.metaPersonalizada || calcularMetaDiaria(usuario.perfil);
  const caloriasHoy = consumoPorFecha[hoy] || 0;
  const caloriasAyer = consumoPorFecha[ayer] || 0;

  if (!caloriasAyer) {
    return {
      estado: "sin_registro",
      prioridad: 0,
      caloriasHoy,
      caloriasAyer,
      metaActiva,
      mensaje: "No registro alimentacion en el dia anterior",
    };
  }

  if (caloriasHoy > metaActiva) {
    return {
      estado: "exceso",
      prioridad: 1,
      caloriasHoy,
      caloriasAyer,
      metaActiva,
      mensaje: "Supero la meta de consumo del dia",
    };
  }

  return {
    estado: "ok",
    prioridad: 2,
    caloriasHoy,
    caloriasAyer,
    metaActiva,
    mensaje: "Seguimiento dentro de rango",
  };
}

export function sugerirMenuDiario(caloriasRestantes) {
  const catalogo = [
    { nombre: "Bowl de yogur, avena y frutos rojos", tipo: "Desayuno", calorias: 340 },
    { nombre: "Pechuga de pollo con quinoa", tipo: "Almuerzo", calorias: 430 },
    { nombre: "Wrap integral de atun", tipo: "Cena", calorias: 310 },
    { nombre: "Manzana con mantequilla de mani", tipo: "Snack", calorias: 180 },
    { nombre: "Crema de verduras con tofu", tipo: "Cena", calorias: 260 },
    { nombre: "Tostadas con huevo y aguacate", tipo: "Desayuno", calorias: 390 },
  ];

  const seleccion = [];
  let restante = caloriasRestantes;

  for (const opcion of catalogo) {
    if (opcion.calorias <= restante) {
      seleccion.push(opcion);
      restante -= opcion.calorias;
    }

    if (seleccion.length === 3) break;
  }

  return seleccion.length ? seleccion : catalogo.slice(0, 2);
}

const CATALOGO_POR_MOMENTO = {
  desayuno: [
    {
      nombre: "Arepa con huevo y aguacate",
      calorias: 410,
      descripcion: "Desayuno alto en saciedad y grasas saludables",
      keywords: ["arepa", "huevo", "aguacate"],
    },
    {
      nombre: "Yogur griego con avena y banano",
      calorias: 360,
      descripcion: "Opcion fresca con proteina y fibra",
      keywords: ["yogur", "avena", "banano"],
    },
    {
      nombre: "Tostadas integrales con queso y pavo",
      calorias: 390,
      descripcion: "Ligero y proteico para la manana",
      keywords: ["tostadas", "queso", "pavo"],
    },
  ],
  almuerzo: [
    {
      nombre: "Pollo a la plancha con arroz y ensalada",
      calorias: 620,
      descripcion: "Base equilibrada para cumplir meta sin exceso",
      keywords: ["pollo", "arroz", "ensalada"],
    },
    {
      nombre: "Pasta integral con atun y vegetales",
      calorias: 680,
      descripcion: "Almuerzo de energia sostenida",
      keywords: ["pasta", "atun", "vegetales"],
    },
    {
      nombre: "Carne magra con pure y brocoli",
      calorias: 710,
      descripcion: "Mayor densidad calorica controlada",
      keywords: ["carne", "pure", "brocoli"],
    },
  ],
  cena: [
    {
      nombre: "Crema de verduras con pollo desmechado",
      calorias: 430,
      descripcion: "Cena ligera con buena proteina",
      keywords: ["crema", "verduras", "pollo"],
    },
    {
      nombre: "Wrap integral de atun con ensalada",
      calorias: 470,
      descripcion: "Practico y ajustado a metas moderadas",
      keywords: ["wrap", "atun", "ensalada"],
    },
    {
      nombre: "Salmon con vegetales asados",
      calorias: 520,
      descripcion: "Cena completa con grasas de calidad",
      keywords: ["salmon", "vegetales"],
    },
  ],
};

function extraerPreferencias(usuario) {
  return (usuario.consumos || []).reduce((acc, consumo) => {
    const tokens = consumo.nombre
      .toLowerCase()
      .split(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]+/)
      .filter((token) => token.length > 3);

    tokens.forEach((token) => {
      acc[token] = (acc[token] || 0) + 1;
    });

    return acc;
  }, {});
}

function puntuarSugerencia(sugerencia, preferencias, caloriasObjetivo) {
  const afinidad = sugerencia.keywords.reduce(
    (sum, keyword) => sum + (preferencias[keyword] || 0),
    0
  );
  const ajusteCalorico = Math.abs(caloriasObjetivo - sugerencia.calorias);

  return afinidad * 100 - ajusteCalorico;
}

export function generarMenusInteligentes(usuario, metaDiariaActiva, caloriasRestantes) {
  if (!usuario) {
    return {
      desayuno: [],
      almuerzo: [],
      cena: [],
    };
  }

  const preferencias = extraerPreferencias(usuario);
  const distribucion = {
    desayuno: Math.min(caloriasRestantes, metaDiariaActiva * 0.25),
    almuerzo: Math.min(caloriasRestantes, metaDiariaActiva * 0.4),
    cena: Math.min(caloriasRestantes, metaDiariaActiva * 0.35),
  };

  return Object.entries(CATALOGO_POR_MOMENTO).reduce((acc, [momento, opciones]) => {
    acc[momento] = [...opciones]
      .sort(
        (a, b) =>
          puntuarSugerencia(b, preferencias, distribucion[momento]) -
          puntuarSugerencia(a, preferencias, distribucion[momento])
      )
      .slice(0, 2)
      .map((item) => ({
        ...item,
        momento,
      }));

    return acc;
  }, {});
}
