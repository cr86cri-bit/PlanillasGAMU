import { crearElemento, textoSeguro } from "../../utilidades/dom.js";
import { EstadoVacio } from "../EstadoVacio/EstadoVacio.js";

export function TablaDatos({
  columnas = [],
  filas = [],
  obtenerClave,
  mensajeVacio = "Sin datos",
} = {}) {
  if (!filas.length) {
    return EstadoVacio({
      titulo: mensajeVacio,
      detalle: "Ajusta los filtros o registra nueva información.",
    });
  }

  const encabezado = crearElemento("thead", {}, [
    crearElemento(
      "tr",
      {},
      columnas.map((columna) => crearElemento("th", { texto: columna.titulo })),
    ),
  ]);

  const cuerpo = crearElemento(
    "tbody",
    {},
    filas.map((fila, indice) =>
      crearElemento(
        "tr",
        {
          atributos: {
            "data-clave": obtenerClave ? obtenerClave(fila) : indice,
          },
        },
        columnas.map((columna) => {
          const contenido = columna.renderizar
            ? columna.renderizar(fila)
            : textoSeguro(fila[columna.clave]);

          return crearElemento("td", {}, [
            contenido instanceof Node ? contenido : document.createTextNode(contenido),
          ]);
        }),
      ),
    ),
  );

  return crearElemento("div", { clases: "tabla-contenedor" }, [
    crearElemento("table", { clases: "tabla-datos" }, [encabezado, cuerpo]),
  ]);
}
