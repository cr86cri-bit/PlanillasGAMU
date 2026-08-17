import { crearElemento } from "../../utilidades/dom.js";
import { Boton } from "../Boton/Boton.js";

export function Paginacion({ pagina = 1, total = 0, tamanoPagina = 20, alCambiar } = {}) {
  const totalPaginas = Math.max(1, Math.ceil(total / tamanoPagina));

  return crearElemento("nav", { clases: "paginacion", atributos: { "aria-label": "Paginación" } }, [
    Boton({
      icono: "<",
      titulo: "Página anterior",
      variante: "secundario",
      deshabilitado: pagina <= 1,
      alClick: () => alCambiar?.(pagina - 1),
    }),
    crearElemento("span", { texto: `Página ${pagina} de ${totalPaginas}` }),
    Boton({
      icono: ">",
      titulo: "Página siguiente",
      variante: "secundario",
      deshabilitado: pagina >= totalPaginas,
      alClick: () => alCambiar?.(pagina + 1),
    }),
  ]);
}
