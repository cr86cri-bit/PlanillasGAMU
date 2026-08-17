import { normalizarTexto } from "../../../utilidades/texto.js";
import {
  obtenerFechaIso,
  obtenerHoraTexto,
  parsearFechaHoraLocal,
} from "../../../utilidades/tiempo.js";

export const columnasExcelRequeridas = [
  "Número",
  "Nombre",
  "Tiempo",
  "Estado",
  "Dispositivos",
  "Tipo de Registro",
];

export function normalizarNombreArchivo(nombreArchivo) {
  return normalizarTexto(nombreArchivo)
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function validarColumnasExcel(columnas) {
  const presentes = new Set(columnas);
  return columnasExcelRequeridas.filter((columna) => !presentes.has(columna));
}

export function normalizarFilaExcel(fila, indice) {
  const fecha = parsearFechaHoraLocal(fila.Tiempo);

  if (!fecha) {
    return {
      valida: false,
      numero_fila: indice + 2,
      error: "La fecha de marcación no tiene un formato válido.",
      fila_original: fila,
    };
  }

  return {
    valida: true,
    numero_fila: indice + 2,
    codigo_biometrico: String(fila.Número ?? "").trim(),
    nombre_excel: String(fila.Nombre ?? "").trim(),
    tiempo_original: String(fila.Tiempo ?? "").trim(),
    estado_excel: String(fila.Estado ?? "").trim(),
    dispositivo: String(fila.Dispositivos ?? "").trim(),
    tipo_registro: String(fila["Tipo de Registro"] ?? "").trim(),
    fecha_marcacion: fecha,
    fecha_marcacion_iso: obtenerFechaIso(fecha),
    hora_marcacion: obtenerHoraTexto(fecha),
  };
}

export function detectarPeriodoMarcaciones(marcaciones) {
  const fechas = marcaciones
    .filter((marcacion) => marcacion.valida)
    .map((marcacion) => marcacion.fecha_marcacion)
    .sort((a, b) => a.getTime() - b.getTime());

  if (!fechas.length) {
    return null;
  }

  const minima = fechas[0];
  const maxima = fechas[fechas.length - 1];

  return {
    fecha_minima: obtenerFechaIso(minima),
    fecha_maxima: obtenerFechaIso(maxima),
    anio_detectado: minima.getFullYear(),
    mes_detectado: minima.getMonth() + 1,
  };
}

export function detectarDuplicadosMarcaciones(marcaciones) {
  const vistos = new Set();
  const duplicados = [];

  marcaciones
    .filter((marcacion) => marcacion.valida)
    .forEach((marcacion) => {
      const clave = [
        marcacion.codigo_biometrico,
        marcacion.fecha_marcacion_iso,
        marcacion.hora_marcacion,
        marcacion.dispositivo,
      ].join("|");

      if (vistos.has(clave)) {
        duplicados.push(marcacion);
      }

      vistos.add(clave);
    });

  return duplicados;
}

export function esArchivoRepetido(importacionesExistentes, importacionNueva) {
  return importacionesExistentes.some((importacion) => {
    const mismoArchivo =
      importacion.nombre_archivo_normalizado === importacionNueva.nombre_archivo_normalizado ||
      importacion.sha256 === importacionNueva.sha256;
    const mismoPeriodo =
      Number(importacion.anio) === Number(importacionNueva.anio) &&
      Number(importacion.mes) === Number(importacionNueva.mes) &&
      importacion.id_unidad === importacionNueva.id_unidad;

    return mismoArchivo || mismoPeriodo;
  });
}

export function agruparPorCodigoBiometrico(marcaciones) {
  return [
    ...new Set(
      marcaciones.filter((marcacion) => marcacion.valida).map((fila) => fila.codigo_biometrico),
    ),
  ]
    .filter(Boolean)
    .sort();
}
