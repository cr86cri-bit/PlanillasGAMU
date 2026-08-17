import { crearElemento } from "../../utilidades/dom.js";

export function EstadoVacio({ titulo = "Sin información", detalle = "" } = {}) {
  return crearElemento("div", { clases: "estado-vacio" }, [
    crearElemento("strong", { texto: titulo }),
    detalle ? crearElemento("span", { clases: "texto-suave", texto: detalle }) : null,
  ]);
}
