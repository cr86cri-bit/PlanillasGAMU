import { crearElemento } from "../../utilidades/dom.js";
import { Boton } from "../Boton/Boton.js";
import { CampoTexto } from "../CampoTexto/CampoTexto.js";

export function BarraFiltros({ valorBusqueda = "", filtros = [], alBuscar, alLimpiar } = {}) {
  return crearElemento("div", { clases: "barra-filtros" }, [
    CampoTexto({
      id: "busqueda-general",
      etiqueta: "Buscar",
      valor: valorBusqueda,
      marcador: "Escribe para filtrar",
      alCambiar: alBuscar,
    }),
    ...filtros,
    Boton({ texto: "Limpiar", variante: "secundario", icono: "limpiar", alClick: alLimpiar }),
  ]);
}
