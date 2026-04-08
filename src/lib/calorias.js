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

export function construirPlanSemanal(metaDiaria, consumoPorFecha) {
  const inicioSemana = obtenerInicioDeSemana();
  const planBase = Array.from({ length: 7 }, (_, index) => {
    const fecha = sumarDias(inicioSemana, index).toISOString().slice(0, 10);
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
