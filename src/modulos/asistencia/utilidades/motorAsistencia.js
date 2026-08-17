import {
  convertirHoraAMinutos,
  convertirMinutosAHora,
  obtenerDiaSemanaIso,
  obtenerFechaIso,
  sumarDias,
} from "../../../utilidades/tiempo.js";

const tiposExcepcionJustificada = new Set([
  "PERMISO",
  "VACACION",
  "BAJA_MEDICA",
  "COMISION",
  "DIA_NO_LABORABLE",
]);

export const MINUTOS_TOLERANCIA_HORA_EXTRA = 30;
export const MINUTOS_MINIMOS_HORA_EXTRA_AUTOMATICA = 30;

export function calcularMinutosAtraso({
  horaObjetivo,
  horaMarcacion,
  minutosTolerancia = 0,
  toleranciaExtra = 0,
}) {
  const objetivo = convertirHoraAMinutos(horaObjetivo);
  const marcacion = convertirHoraAMinutos(horaMarcacion);
  const limite = objetivo + Number(minutosTolerancia) + Number(toleranciaExtra);

  return Math.max(0, marcacion - limite);
}

export function crearMarcacion(fecha, hora, datos = {}) {
  return {
    fecha,
    hora,
    minuto_jornada: calcularMinutoJornada(fecha, fecha, hora),
    ...datos,
  };
}

export function calcularMinutoJornada(fechaJornada, fechaMarcacion, hora) {
  const minuto = convertirHoraAMinutos(hora);

  if (fechaMarcacion > fechaJornada) {
    return minuto + 1440;
  }

  if (fechaMarcacion < fechaJornada) {
    return minuto - 1440;
  }

  return minuto;
}

export function normalizarMarcacionesParaJornada(fecha, marcaciones) {
  return marcaciones
    .map((marcacion, indice) => {
      const fechaMarcacion =
        marcacion.fecha ??
        (marcacion.fecha_marcacion ? obtenerFechaIso(new Date(marcacion.fecha_marcacion)) : fecha);
      const hora =
        marcacion.hora ??
        marcacion.hora_marcacion ??
        (marcacion.fecha_marcacion
          ? new Date(marcacion.fecha_marcacion).toTimeString().slice(0, 5)
          : "00:00");

      return {
        ...marcacion,
        indice,
        fecha: fechaMarcacion,
        hora: hora.slice(0, 5),
        minuto_jornada: calcularMinutoJornada(fecha, fechaMarcacion, hora.slice(0, 5)),
      };
    })
    .sort((a, b) => a.minuto_jornada - b.minuto_jornada);
}

export function obtenerSlotsDia(horario, fecha) {
  const diaSemana = obtenerDiaSemanaIso(fecha);
  const regla = horario?.reglas?.find((item) => Number(item.dia_semana) === diaSemana);

  if (!regla || !regla.es_laboral) {
    return [];
  }

  return [...(regla.marcaciones_esperadas ?? [])].sort((a, b) => a.orden - b.orden);
}

export function esFeriadoAplicable(fecha, feriados = []) {
  return feriados.some((feriado) => feriado.fecha === fecha && feriado.aplica !== false);
}

export function obtenerExcepcionJustificada(fecha, excepciones = []) {
  return excepciones.find(
    (excepcion) =>
      excepcion.fecha_desde <= fecha &&
      excepcion.fecha_hasta >= fecha &&
      excepcion.estado === "APROBADO" &&
      tiposExcepcionJustificada.has(excepcion.tipo),
  );
}

export function obtenerToleranciaHorasExtra(fecha, horasExtra = []) {
  const registro = horasExtra.find(
    (horaExtra) =>
      horaExtra.aprobado === true &&
      horaExtra.fecha_aplicacion === fecha &&
      horaExtra.estado !== "CONSUMIDO" &&
      horaExtra.estado !== "RECHAZADO" &&
      (horaExtra.estado === undefined ||
        horaExtra.estado === null ||
        horaExtra.estado === "APROBADO"),
  );

  if (!registro) {
    return {
      minutos: 0,
      origen: null,
    };
  }

  return {
    minutos: Number(registro.minutos_tolerancia_otorgados ?? 30),
    origen: registro,
  };
}

export function obtenerDiaLaboralSiguiente(fecha, { horario, feriados = [] } = {}) {
  let candidata = fecha;

  for (let intento = 0; intento < 14; intento += 1) {
    candidata = sumarDias(candidata, 1);
    const slots = obtenerSlotsDia(horario, candidata);

    if (slots.length && !esFeriadoAplicable(candidata, feriados)) {
      return candidata;
    }
  }

  return null;
}

export function construirVentanaSlot(slot) {
  const inicio = convertirHoraAMinutos(slot.hora_inicio_ventana);
  let fin = convertirHoraAMinutos(slot.hora_fin_ventana);
  const objetivo = convertirHoraAMinutos(slot.hora_objetivo);

  if (slot.cruza_medianoche || fin < inicio) {
    fin += 1440;
  }

  return {
    inicio,
    fin,
    objetivo: slot.cruza_medianoche && objetivo < inicio ? objetivo + 1440 : objetivo,
  };
}

export function clasificarMarcaciones({ fecha, slots, marcaciones, toleranciaExtra = 0 }) {
  const marcacionesNormalizadas = normalizarMarcacionesParaJornada(fecha, marcaciones);
  const usadas = new Set();

  const resultados = slots.map((slot) => {
    const ventana = construirVentanaSlot(slot);
    const candidatas = marcacionesNormalizadas
      .filter((marcacion) => !usadas.has(marcacion.indice))
      .filter(
        (marcacion) =>
          marcacion.minuto_jornada >= ventana.inicio && marcacion.minuto_jornada <= ventana.fin,
      )
      .sort((a, b) => {
        const distanciaA = Math.abs(a.minuto_jornada - ventana.objetivo);
        const distanciaB = Math.abs(b.minuto_jornada - ventana.objetivo);
        return distanciaA - distanciaB || a.minuto_jornada - b.minuto_jornada;
      });

    const marcacion = candidatas[0] ?? null;

    if (marcacion) {
      usadas.add(marcacion.indice);
    }

    const minutosAtraso =
      marcacion && slot.tipo === "ENTRADA"
        ? Math.max(
            0,
            marcacion.minuto_jornada -
              (ventana.objetivo + Number(slot.minutos_tolerancia ?? 0) + Number(toleranciaExtra)),
          )
        : 0;

    return {
      id_marcacion_esperada: slot.id_marcacion_esperada,
      tipo: slot.tipo,
      hora_objetivo: convertirMinutosAHora(ventana.objetivo),
      hora_marcacion: marcacion?.hora ?? null,
      fecha_marcacion: marcacion?.fecha ?? null,
      minuto_objetivo: ventana.objetivo,
      minuto_marcacion: marcacion?.minuto_jornada ?? null,
      estado: marcacion ? (minutosAtraso > 0 ? "ATRASO" : "PUNTUAL") : "OMISION",
      minutos_atraso: minutosAtraso,
      obligatorio: slot.obligatorio !== false,
      explicacion: marcacion
        ? `Marcación ${marcacion.hora} clasificada para ${slot.tipo} ${slot.hora_objetivo}.`
        : `No se encontró marcación dentro de la ventana de ${slot.tipo} ${slot.hora_objetivo}.`,
      marcacion,
    };
  });

  const adicionales = marcacionesNormalizadas.filter((marcacion) => !usadas.has(marcacion.indice));

  return {
    resultados,
    adicionales,
  };
}

export function calcularMinutosHoraExtra(resultados = []) {
  const salidas = resultados.filter(
    (resultado) =>
      resultado.tipo === "SALIDA" &&
      resultado.minuto_marcacion !== null &&
      resultado.minuto_marcacion !== undefined &&
      resultado.minuto_objetivo !== null &&
      resultado.minuto_objetivo !== undefined,
  );
  const ultimaSalida = salidas.at(-1);

  if (!ultimaSalida) {
    return 0;
  }

  return Math.max(0, Number(ultimaSalida.minuto_marcacion) - Number(ultimaSalida.minuto_objetivo));
}

export function calcularAsistenciaDiaria({
  fecha,
  horario,
  marcaciones = [],
  feriados = [],
  excepciones = [],
  horasExtra = [],
} = {}) {
  const slots = obtenerSlotsDia(horario, fecha);
  const feriado = esFeriadoAplicable(fecha, feriados);
  const excepcion = obtenerExcepcionJustificada(fecha, excepciones);
  const esLaboral = slots.length > 0;
  const tolerancia = obtenerToleranciaHorasExtra(fecha, horasExtra);

  if (!esLaboral) {
    return {
      fecha,
      estado: "NO_LABORAL",
      minutos_atraso: 0,
      cantidad_atrasos: 0,
      cantidad_omisiones: 0,
      cantidad_faltas: 0,
      minutos_hora_extra: 0,
      tolerancia_horas_extra: tolerancia.minutos,
      origen_tolerancia: tolerancia.origen,
      resultados: [],
      marcaciones_adicionales: marcaciones,
      explicacion: construirExplicacionBase(
        "El horario vigente no define marcaciones obligatorias para este día.",
        tolerancia,
      ),
    };
  }

  if (feriado || excepcion) {
    return {
      fecha,
      estado: feriado ? "FERIADO" : excepcion.tipo,
      minutos_atraso: 0,
      cantidad_atrasos: 0,
      cantidad_omisiones: 0,
      cantidad_faltas: 0,
      minutos_hora_extra: 0,
      tolerancia_horas_extra: tolerancia.minutos,
      origen_tolerancia: tolerancia.origen,
      resultados: [],
      marcaciones_adicionales: marcaciones,
      explicacion: construirExplicacionBase(
        feriado
          ? "El día es feriado aplicable y no genera incidencia."
          : `Existe excepción aprobada de tipo ${excepcion.tipo}.`,
        tolerancia,
      ),
    };
  }

  if (marcaciones.length === 0) {
    return {
      fecha,
      estado: "FALTA",
      minutos_atraso: 0,
      cantidad_atrasos: 0,
      cantidad_omisiones: 0,
      cantidad_faltas: 1,
      minutos_hora_extra: 0,
      tolerancia_horas_extra: tolerancia.minutos,
      origen_tolerancia: tolerancia.origen,
      resultados: slots.map((slot) => ({
        id_marcacion_esperada: slot.id_marcacion_esperada,
        tipo: slot.tipo,
        hora_objetivo: slot.hora_objetivo,
        hora_marcacion: null,
        estado: "FALTA",
        minutos_atraso: 0,
        obligatorio: slot.obligatorio !== false,
      })),
      marcaciones_adicionales: [],
      explicacion: construirExplicacionBase(
        "No existen marcaciones en un día laboral esperado; se registra falta sin omisiones adicionales.",
        tolerancia,
      ),
    };
  }

  const clasificacion = clasificarMarcaciones({
    fecha,
    slots,
    marcaciones,
    toleranciaExtra: tolerancia.minutos,
  });

  const resultadosObligatorios = clasificacion.resultados.filter(
    (resultado) => resultado.obligatorio,
  );
  const cantidadOmisiones = resultadosObligatorios.filter(
    (resultado) => resultado.estado === "OMISION",
  ).length;
  const resultadosAtraso = resultadosObligatorios.filter(
    (resultado) => resultado.minutos_atraso > 0,
  );
  const minutosAtraso = resultadosAtraso.reduce(
    (total, resultado) => total + resultado.minutos_atraso,
    0,
  );
  const minutosHoraExtra = calcularMinutosHoraExtra(clasificacion.resultados);
  const estado = cantidadOmisiones > 0 ? "OMISION" : minutosAtraso > 0 ? "ATRASO" : "PUNTUAL";

  return {
    fecha,
    estado,
    minutos_atraso: minutosAtraso,
    cantidad_atrasos: resultadosAtraso.length,
    cantidad_omisiones: cantidadOmisiones,
    cantidad_faltas: 0,
    minutos_hora_extra: minutosHoraExtra,
    tolerancia_horas_extra: tolerancia.minutos,
    origen_tolerancia: tolerancia.origen,
    resultados: clasificacion.resultados,
    marcaciones_adicionales: clasificacion.adicionales,
    explicacion: construirExplicacion({
      estado,
      minutosAtraso,
      cantidadOmisiones,
      minutosHoraExtra,
      tolerancia,
    }),
  };
}

function construirExplicacionBase(texto, tolerancia) {
  if (tolerancia.minutos <= 0) {
    return texto;
  }

  return `${texto} La tolerancia de ${tolerancia.minutos} minutos por horas extra corresponde únicamente a este día.`;
}

function construirExplicacion({
  estado,
  minutosAtraso,
  cantidadOmisiones,
  minutosHoraExtra,
  tolerancia,
}) {
  const partes = [`Resultado ${estado}.`];

  if (minutosAtraso > 0) {
    partes.push(`Atraso acumulado: ${minutosAtraso} minutos.`);
  }

  if (cantidadOmisiones > 0) {
    partes.push(`Marcaciones obligatorias omitidas: ${cantidadOmisiones}.`);
  }

  if (minutosHoraExtra > 0) {
    partes.push(`Hora extra calculada por salida posterior al horario: ${minutosHoraExtra} minutos.`);
  }

  if (tolerancia.minutos > 0) {
    partes.push(
      `Se aplicaron ${tolerancia.minutos} minutos de tolerancia por horas extras aprobadas solo para este día.`,
    );
  }

  return partes.join(" ");
}
