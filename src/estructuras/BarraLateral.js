import { rutasProtegidas } from "../aplicacion/rutas.js";
import { navegarA } from "../aplicacion/enrutador.js";
import { usuarioTieneAlgunoDeLosPermisos } from "../nucleo/autenticacion/permisos.js";
import { crearElemento } from "../utilidades/dom.js";
import { Icono } from "../componentes/Icono/Icono.js";

export function BarraLateral({ rutaActual, usuarioActual, abierta = false } = {}) {
  const rutasPermitidas = rutasProtegidas
    .filter((ruta) => usuarioTieneAlgunoDeLosPermisos(usuarioActual, ruta.permisos))
    .filter((ruta) => !ruta.oculta);

  return crearElemento(
    "aside",
    { clases: ["barra-lateral", abierta ? "barra-lateral--abierta" : ""] },
    [
      crearElemento("div", { clases: "barra-lateral__marca" }, [
        crearElemento("strong", { texto: "GAMU" }),
        crearElemento("span", { texto: "Control individual de asistencia" }),
      ]),
      crearElemento(
        "nav",
        {
          clases: "barra-lateral__navegacion",
          atributos: { "aria-label": "Navegación principal" },
        },
        rutasPermitidas.map((ruta) =>
          crearElemento(
            "button",
            {
              clases: [
                "barra-lateral__enlace",
                ruta.ruta === rutaActual?.ruta ? "barra-lateral__enlace--activo" : "",
              ],
              atributos: { type: "button" },
              eventos: { click: () => navegarA(ruta.ruta) },
            },
            [Icono({ nombre: ruta.icono }), crearElemento("span", { texto: ruta.etiqueta })],
          ),
        ),
      ),
    ],
  );
}
