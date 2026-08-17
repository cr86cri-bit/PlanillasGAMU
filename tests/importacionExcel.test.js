import { describe, expect, it } from "vitest";
import {
  detectarDuplicadosMarcaciones,
  detectarPeriodoMarcaciones,
  esArchivoRepetido,
  normalizarFilaExcel,
  normalizarNombreArchivo,
} from "../src/modulos/importaciones/utilidades/importacionExcel.js";

describe("importacionExcel", () => {
  it("detecta marcacion duplicada", () => {
    const filas = [
      normalizarFilaExcel(
        {
          Número: "1330523",
          Nombre: "ROSARIO MONTANO VALVERDE",
          Tiempo: "23/6/2026 08:34:29",
          Estado: "Salida",
          Dispositivos: "GAMU",
          "Tipo de Registro": "0",
        },
        0,
      ),
      normalizarFilaExcel(
        {
          Número: "1330523",
          Nombre: "ROSARIO MONTANO VALVERDE",
          Tiempo: "23/6/2026 08:34:29",
          Estado: "",
          Dispositivos: "GAMU",
          "Tipo de Registro": "0",
        },
        1,
      ),
    ];

    expect(detectarDuplicadosMarcaciones(filas)).toHaveLength(1);
  });

  it("detecta archivo repetido por hash o periodo", () => {
    const importaciones = [
      {
        nombre_archivo_normalizado: "julio-terminal",
        sha256: "abc",
        anio: 2026,
        mes: 7,
        id_unidad: "unidad-1",
      },
    ];

    expect(
      esArchivoRepetido(importaciones, {
        nombre_archivo_normalizado: "otro",
        sha256: "def",
        anio: 2026,
        mes: 7,
        id_unidad: "unidad-1",
      }),
    ).toBe(true);
  });

  it("detecta periodo real diferente al nombre declarado", () => {
    const marcaciones = [
      normalizarFilaExcel(
        {
          Número: "1",
          Nombre: "FUNCIONARIO",
          Tiempo: "23/6/2026 08:34:29",
          Estado: "",
          Dispositivos: "GAMU",
          "Tipo de Registro": "0",
        },
        0,
      ),
    ];
    const periodo = detectarPeriodoMarcaciones(marcaciones);

    expect(normalizarNombreArchivo("Julio-Terminal.xlsx")).toBe("julio-terminal");
    expect(periodo.anio_detectado).toBe(2026);
    expect(periodo.mes_detectado).toBe(6);
  });
});
