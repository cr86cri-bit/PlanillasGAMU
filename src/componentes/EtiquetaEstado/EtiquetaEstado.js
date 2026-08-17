import { crearElemento } from "../../utilidades/dom.js";

const mapaEstado = {
  ACTIVO: "activo",
  INACTIVO: "inactivo",
  PENDIENTE: "pendiente",
  PROCESANDO: "proceso",
  COMPLETADO: "completado",
  ERROR: "error",
  REVERTIDO: "inactivo",
  PUNTUAL: "puntual",
  ATRASO: "atraso",
  OMISION: "omision",
  FALTA: "falta",
  NO_LABORAL: "informacion",
  REGULAR: "puntual",
};

export function EtiquetaEstado({ estado = "PENDIENTE", texto = estado } = {}) {
  return crearElemento("span", {
    clases: ["etiqueta-estado", `etiqueta-estado--${mapaEstado[estado] ?? "informacion"}`],
    texto,
  });
}
