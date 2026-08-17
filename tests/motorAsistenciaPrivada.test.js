import { describe, expect, it } from "vitest";
import { calcularAsistenciaDiaria } from "../src/modulos/asistencia/utilidades/motorAsistencia.js";

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
  };
}

const horarioAdministrativo = {
  reglas: [
    {
      dia_semana: 1,
      es_laboral: true,
      marcaciones_esperadas: [
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
          hora_fin_ventana: "23:59",
        }),
      ],
    },
  ],
};

function marca(id_marcacion, hora) {
  return {
    id_marcacion,
    fecha_marcacion: `2026-07-06T${hora}:00`,
  };
}

describe("calcularAsistenciaDiaria para Worker", () => {
  it("calcula minutos de hora extra desde la ultima salida posterior al horario", () => {
    const resultado = calcularAsistenciaDiaria({
      fecha: "2026-07-06",
      horario: horarioAdministrativo,
      marcaciones: [
        marca("m1", "08:30"),
        marca("m2", "12:30"),
        marca("m3", "14:30"),
        marca("m4", "19:05"),
      ],
      feriados: [],
      excepciones: [],
      horasExtra: [],
    });

    expect(resultado.estado).toBe("PUNTUAL");
    expect(resultado.minutos_hora_extra).toBe(35);
  });

  it("aplica tolerancia aprobada solo en la fecha de aplicacion exacta", () => {
    const resultado = calcularAsistenciaDiaria({
      fecha: "2026-07-06",
      horario: horarioAdministrativo,
      marcaciones: [
        marca("m1", "09:00"),
        marca("m2", "12:30"),
        marca("m3", "14:30"),
        marca("m4", "18:30"),
      ],
      feriados: [],
      excepciones: [],
      horasExtra: [
        {
          aprobado: true,
          estado: "APROBADO",
          fecha_aplicacion: "2026-07-06",
          minutos_tolerancia_otorgados: 30,
        },
      ],
    });

    expect(resultado.minutos_atraso).toBe(0);
    expect(resultado.tolerancia_horas_extra).toBe(30);
  });
});
