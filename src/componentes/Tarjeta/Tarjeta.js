import { crearElemento } from "../../utilidades/dom.js";

export function Tarjeta({ titulo, acciones, cuerpo, pie, clase = "" } = {}) {
  return crearElemento("section", { clases: ["tarjeta", clase] }, [
    titulo || acciones
      ? crearElemento("header", { clases: "tarjeta__cabecera" }, [
          titulo ? crearElemento("h3", { clases: "tarjeta__titulo", texto: titulo }) : null,
          acciones ?? null,
        ])
      : null,
    crearElemento("div", { clases: "tarjeta__cuerpo" }, Array.isArray(cuerpo) ? cuerpo : [cuerpo]),
    pie ? crearElemento("footer", { clases: "tarjeta__pie" }, [pie]) : null,
  ]);
}
