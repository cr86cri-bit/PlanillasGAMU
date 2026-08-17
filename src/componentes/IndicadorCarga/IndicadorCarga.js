import { crearElemento } from "../../utilidades/dom.js";

export function IndicadorCarga({ texto = "Cargando..." } = {}) {
  return crearElemento("span", { clases: "indicador-carga", texto });
}
