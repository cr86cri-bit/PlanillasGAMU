import { describe, expect, it } from "vitest";
import {
  calcularAsistenciaDiaria,
  calcularMinutosAtraso,
  obtenerDiaLaboralSiguiente,
} from "../src/modulos/asistencia/utilidades/motorAsistencia.js";

function crearHorario(nombre, reglas) {
  return { nombre, reglas };
}

function crearRegla(dia_semana, marcaciones_esperadas) {
  return { dia_semana, es_laboral: true, marcaciones_esperadas };
}

function slot(tipo, hora_objetivo, orden, extras = {}) {
  return {
    id_marcacion_esperada: `${tipo}-${hora_objetivo}-${orden}`,
    tipo,
    hora_objetivo,
    hora_inicio_ventana: extras.hora_inicio_ventana ?? hora_objetivo,
    hora_fin_ventana: extras.hora_fin_ventana ?? hora_objetivo,
    minutos_tolerancia: extras.minutos_tolerancia ?? 0,
    orden,
    cruza_medianoche: extras.cruza_medianoche ?? false,
    obligatorio: extras.obligatorio ?? true,
  };
}

const slotsAdministrativos = [
  slot("ENTRADA", "08:30", 1, {
    hora_inicio_ventana: "06:00",
    hora_fin_ventana: "10:30",
    minutos_tolerancia: 5,
  }),
  slot("SALIDA", "12:30", 2, {
    hora_inicio_ventana: "12:00",
    hora_fin_ventana: "13:30",
  }),
  slot("ENTRADA", "14:30", 3, {
    hora_inicio_ventana: "13:30",
    hora_fin_ventana: "16:30",
    minutos_tolerancia: 5,
  }),
  slot("SALIDA", "18:30", 4, {
    hora_inicio_ventana: "18:00",
    hora_fin_ventana: "00:00",
    cruza_medianoche: true,
  }),
];

const horarioAdministrativo = crearHorario(
  "Administrativo",
  [1, 2, 3, 4, 5].map((dia) => crearRegla(dia, slotsAdministrativos)),
);

const horarioContinuo = crearHorario("Continuo", [
  crearRegla(1, [
    slot("ENTRADA", "07:00", 1, {
      hora_inicio_ventana: "06:00",
      hora_fin_ventana: "08:00",
      minutos_tolerancia: 5,
    }),
    slot("SALIDA", "15:00", 2, {
      hora_inicio_ventana: "14:30",
      hora_fin_ventana: "16:00",
    }),
  ]),
]);

const horarioLimpieza = crearHorario("Limpieza", [
  crearRegla(1, [
    slot("ENTRADA", "04:00", 1, {
      hora_inicio_ventana: "03:30",
      hora_fin_ventana: "05:30",
      minutos_tolerancia: 5,
    }),
    slot("SALIDA", "08:30", 2, { hora_inicio_ventana: "08:00", hora_fin_ventana: "09:30" }),
    slot("ENTRADA", "14:30", 3, {
      hora_inicio_ventana: "13:30",
      hora_fin_ventana: "16:30",
      minutos_tolerancia: 5,
    }),
    slot("SALIDA", "18:30", 4, {
      hora_inicio_ventana: "18:00",
      hora_fin_ventana: "00:00",
      cruza_medianoche: true,
    }),
  ]),
]);

const horarioRecoleccion = crearHorario("Recoleccion", [
  crearRegla(1, [
    slot("ENTRADA", "05:00", 1, {
      hora_inicio_ventana: "04:30",
      hora_fin_ventana: "07:00",
      minutos_tolerancia: 5,
    }),
    slot("SALIDA", "13:00", 2, { hora_inicio_ventana: "12:30", hora_fin_ventana: "15:00" }),
  ]),
  crearRegla(2, [
    slot("ENTRADA", "06:00", 1, {
      hora_inicio_ventana: "05:30",
      hora_fin_ventana: "08:00",
      minutos_tolerancia: 5,
    }),
    slot("SALIDA", "14:00", 2, { hora_inicio_ventana: "13:30", hora_fin_ventana: "15:00" }),
  ]),
]);

describe("calcularMinutosAtraso", () => {
  it("considera puntual una entrada exacta", () => {
    expect(
      calcularMinutosAtraso({
        horaObjetivo: "08:30",
        horaMarcacion: "08:30",
        minutosTolerancia: 5,
      }),
    ).toBe(0);
  });

  it("considera puntual una entrada dentro de la tolerancia", () => {
    expect(
      calcularMinutosAtraso({
        horaObjetivo: "08:30",
        horaMarcacion: "08:35",
        minutosTolerancia: 5,
      }),
    ).toBe(0);
  });

  it("calcula un minuto de atraso despues de la tolerancia", () => {
    expect(
      calcularMinutosAtraso({
        horaObjetivo: "08:30",
        horaMarcacion: "08:36",
        minutosTolerancia: 5,
      }),
    ).toBe(1);
  });
});

describe("calcularAsistenciaDiaria", () => {
  it("calcula total de minutos para entradas con atraso", () => {
    const resultado = calcularAsistenciaDiaria({
      fecha: "2026-07-06",
      horario: horarioAdministrativo,
      marcaciones: [
        { fecha: "2026-07-06", hora: "08:47" },
        { fecha: "2026-07-06", hora: "12:31" },
        { fecha: "2026-07-06", hora: "14:41" },
        { fecha: "2026-07-06", hora: "18:31" },
      ],
    });

    expect(resultado.estado).toBe("ATRASO");
    expect(resultado.minutos_atraso).toBe(18);
  });

  it("clasifica cuatro marcas correctas como puntual", () => {
    const resultado = calcularAsistenciaDiaria({
      fecha: "2026-07-06",
      horario: horarioAdministrativo,
      marcaciones: [
        { fecha: "2026-07-06", hora: "08:34" },
        { fecha: "2026-07-06", hora: "12:30" },
        { fecha: "2026-07-06", hora: "14:34" },
        { fecha: "2026-07-06", hora: "18:30" },
      ],
    });

    expect(resultado.estado).toBe("PUNTUAL");
    expect(resultado.cantidad_omisiones).toBe(0);
  });

  it("registra tres marcas y una omision", () => {
    const resultado = calcularAsistenciaDiaria({
      fecha: "2026-07-06",
      horario: horarioAdministrativo,
      marcaciones: [
        { fecha: "2026-07-06", hora: "08:34" },
        { fecha: "2026-07-06", hora: "12:30" },
        { fecha: "2026-07-06", hora: "18:30" },
      ],
    });

    expect(resultado.estado).toBe("OMISION");
    expect(resultado.cantidad_omisiones).toBe(1);
  });

  it("registra falta cuando no existen marcaciones sin sumar omisiones adicionales", () => {
    const resultado = calcularAsistenciaDiaria({
      fecha: "2026-07-06",
      horario: horarioAdministrativo,
      marcaciones: [],
    });

    expect(resultado.estado).toBe("FALTA");
    expect(resultado.cantidad_faltas).toBe(1);
    expect(resultado.cantidad_omisiones).toBe(0);
  });

  it("procesa horario continuo con dos marcas", () => {
    const resultado = calcularAsistenciaDiaria({
      fecha: "2026-07-06",
      horario: horarioContinuo,
      marcaciones: [
        { fecha: "2026-07-06", hora: "07:03" },
        { fecha: "2026-07-06", hora: "15:02" },
      ],
    });

    expect(resultado.estado).toBe("PUNTUAL");
    expect(resultado.resultados).toHaveLength(2);
  });

  it("procesa horario de limpieza", () => {
    const resultado = calcularAsistenciaDiaria({
      fecha: "2026-07-06",
      horario: horarioLimpieza,
      marcaciones: [
        { fecha: "2026-07-06", hora: "04:04" },
        { fecha: "2026-07-06", hora: "08:30" },
        { fecha: "2026-07-06", hora: "14:31" },
        { fecha: "2026-07-06", hora: "18:30" },
      ],
    });

    expect(resultado.estado).toBe("PUNTUAL");
  });

  it("procesa recoleccion segun dia de semana", () => {
    const lunes = calcularAsistenciaDiaria({
      fecha: "2026-07-06",
      horario: horarioRecoleccion,
      marcaciones: [
        { fecha: "2026-07-06", hora: "05:01" },
        { fecha: "2026-07-06", hora: "13:02" },
      ],
    });
    const martes = calcularAsistenciaDiaria({
      fecha: "2026-07-07",
      horario: horarioRecoleccion,
      marcaciones: [
        { fecha: "2026-07-07", hora: "06:01" },
        { fecha: "2026-07-07", hora: "14:02" },
      ],
    });

    expect(lunes.estado).toBe("PUNTUAL");
    expect(martes.estado).toBe("PUNTUAL");
  });

  it("no genera incidencia en feriado", () => {
    const resultado = calcularAsistenciaDiaria({
      fecha: "2026-07-06",
      horario: horarioAdministrativo,
      feriados: [{ fecha: "2026-07-06", aplica: true }],
      marcaciones: [],
    });

    expect(resultado.estado).toBe("FERIADO");
    expect(resultado.cantidad_faltas).toBe(0);
  });

  it("no genera falta durante permiso", () => {
    const resultado = calcularAsistenciaDiaria({
      fecha: "2026-07-06",
      horario: horarioAdministrativo,
      excepciones: [
        {
          tipo: "PERMISO",
          estado: "APROBADO",
          fecha_desde: "2026-07-06",
          fecha_hasta: "2026-07-06",
        },
      ],
      marcaciones: [],
    });

    expect(resultado.estado).toBe("PERMISO");
  });

  it("no genera falta durante vacacion", () => {
    const resultado = calcularAsistenciaDiaria({
      fecha: "2026-07-06",
      horario: horarioAdministrativo,
      excepciones: [
        {
          tipo: "VACACION",
          estado: "APROBADO",
          fecha_desde: "2026-07-06",
          fecha_hasta: "2026-07-10",
        },
      ],
      marcaciones: [],
    });

    expect(resultado.estado).toBe("VACACION");
  });

  it("aplica hora extra como tolerancia del siguiente dia", () => {
    const resultado = calcularAsistenciaDiaria({
      fecha: "2026-07-06",
      horario: horarioAdministrativo,
      horasExtra: [
        {
          aprobado: true,
          fecha_aplicacion: "2026-07-06",
          minutos_tolerancia_otorgados: 30,
        },
      ],
      marcaciones: [
        { fecha: "2026-07-06", hora: "09:00" },
        { fecha: "2026-07-06", hora: "12:30" },
        { fecha: "2026-07-06", hora: "14:30" },
        { fecha: "2026-07-06", hora: "18:30" },
      ],
    });

    expect(resultado.minutos_atraso).toBe(0);
    expect(resultado.tolerancia_horas_extra).toBe(30);
  });

  it("calcula minutos de hora extra con la ultima salida posterior al horario", () => {
    const resultado = calcularAsistenciaDiaria({
      fecha: "2026-07-06",
      horario: horarioAdministrativo,
      marcaciones: [
        { fecha: "2026-07-06", hora: "08:30" },
        { fecha: "2026-07-06", hora: "12:30" },
        { fecha: "2026-07-06", hora: "14:30" },
        { fecha: "2026-07-06", hora: "19:05" },
      ],
    });

    expect(resultado.estado).toBe("PUNTUAL");
    expect(resultado.minutos_hora_extra).toBe(35);
  });

  it("no aplica tolerancia si el registro manual no esta aprobado", () => {
    const resultado = calcularAsistenciaDiaria({
      fecha: "2026-07-06",
      horario: horarioAdministrativo,
      horasExtra: [
        {
          aprobado: false,
          estado: "PENDIENTE",
          fecha_aplicacion: "2026-07-06",
          minutos_tolerancia_otorgados: 30,
        },
      ],
      marcaciones: [
        { fecha: "2026-07-06", hora: "09:00" },
        { fecha: "2026-07-06", hora: "12:30" },
        { fecha: "2026-07-06", hora: "14:30" },
        { fecha: "2026-07-06", hora: "18:30" },
      ],
    });

    expect(resultado.minutos_atraso).toBe(25);
    expect(resultado.tolerancia_horas_extra).toBe(0);
  });

  it("vence la tolerancia de hora extra despues del dia aplicable", () => {
    const resultado = calcularAsistenciaDiaria({
      fecha: "2026-07-07",
      horario: horarioAdministrativo,
      horasExtra: [
        {
          aprobado: true,
          fecha_aplicacion: "2026-07-06",
          minutos_tolerancia_otorgados: 30,
        },
      ],
      marcaciones: [
        { fecha: "2026-07-07", hora: "09:00" },
        { fecha: "2026-07-07", hora: "12:30" },
        { fecha: "2026-07-07", hora: "14:30" },
        { fecha: "2026-07-07", hora: "18:30" },
      ],
    });

    expect(resultado.minutos_atraso).toBe(25);
  });

  it("asocia salida proxima a medianoche con la jornada anterior", () => {
    const horarioNocturno = crearHorario("Nocturno", [
      crearRegla(1, [
        slot("ENTRADA", "16:00", 1, { hora_inicio_ventana: "15:00", hora_fin_ventana: "17:00" }),
        slot("SALIDA", "23:50", 2, {
          hora_inicio_ventana: "23:00",
          hora_fin_ventana: "00:30",
          cruza_medianoche: true,
        }),
      ]),
    ]);
    const resultado = calcularAsistenciaDiaria({
      fecha: "2026-07-06",
      horario: horarioNocturno,
      marcaciones: [
        { fecha: "2026-07-06", hora: "16:00" },
        { fecha: "2026-07-07", hora: "00:05" },
      ],
    });

    expect(resultado.estado).toBe("PUNTUAL");
    expect(resultado.resultados[1].fecha_marcacion).toBe("2026-07-07");
  });

  it("traslada tolerancia al siguiente dia laboral cuando corresponde", () => {
    const siguiente = obtenerDiaLaboralSiguiente("2026-07-03", {
      horario: horarioAdministrativo,
      feriados: [{ fecha: "2026-07-06", aplica: true }],
    });

    expect(siguiente).toBe("2026-07-07");
  });
});
