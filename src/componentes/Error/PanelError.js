import { crearElemento } from "../../utilidades/dom.js";

export function PanelError({ titulo = "No se pudo cargar la información", detalle = "" } = {}) {
  return crearElemento("div", { clases: "panel-error", atributos: { role: "alert" } }, [
    crearElemento("strong", { texto: titulo }),
    detalle ? crearElemento("span", { texto: detalle }) : null,
  ]);
}
