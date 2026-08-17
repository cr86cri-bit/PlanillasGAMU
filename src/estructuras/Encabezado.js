import { crearElemento } from "../utilidades/dom.js";
import { Boton } from "../componentes/Boton/Boton.js";

export function Encabezado({ ruta, usuarioActual, alAlternarMenu, alCerrarSesion } = {}) {
  return crearElemento("header", { clases: "encabezado" }, [
    crearElemento("div", { clases: "acciones" }, [
      Boton({
        icono: "menu",
        titulo: "Abrir navegación",
        variante: "secundario",
        alClick: alAlternarMenu,
      }),
      crearElemento("div", { clases: "encabezado__titulo" }, [
        crearElemento("h1", { texto: ruta?.titulo ?? "Sistema de asistencia" }),
        crearElemento("span", {
          texto: usuarioActual?.correo
            ? `Sesión verificada: ${usuarioActual.correo}`
            : "Sesión pendiente de verificación",
        }),
      ]),
    ]),
    Boton({ texto: "Salir", icono: "salir", variante: "secundario", alClick: alCerrarSesion }),
  ]);
}
