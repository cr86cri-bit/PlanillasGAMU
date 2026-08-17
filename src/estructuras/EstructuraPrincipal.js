import { obtenerRutaActual } from "../aplicacion/enrutador.js";
import { limpiarNodo, crearElemento } from "../utilidades/dom.js";
import { BarraLateral } from "./BarraLateral.js";
import { Encabezado } from "./Encabezado.js";

export function EstructuraPrincipal({ contenido, ruta, usuarioActual, alCerrarSesion } = {}) {
  let menuAbierto = false;
  const estructura = crearElemento("div", { clases: "estructura" });

  function renderizar() {
    limpiarNodo(estructura);
    estructura.append(
      BarraLateral({ rutaActual: ruta, usuarioActual, abierta: menuAbierto }),
      crearElemento("div", { clases: "contenido-principal" }, [
        Encabezado({
          ruta,
          usuarioActual,
          alCerrarSesion,
          alAlternarMenu: () => {
            menuAbierto = !menuAbierto;
            renderizar();
          },
        }),
        contenido,
      ]),
    );
  }

  window.addEventListener(
    "hashchange",
    () => {
      menuAbierto = false;
      renderizar();
    },
    { once: true },
  );

  renderizar();
  estructura.dataset.ruta = obtenerRutaActual();
  return estructura;
}
