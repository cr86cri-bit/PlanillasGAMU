import { crearElemento } from "../../utilidades/dom.js";

let contenedorNotificaciones = null;

function obtenerContenedor() {
  if (!contenedorNotificaciones) {
    contenedorNotificaciones = crearElemento("div", {
      clases: "notificaciones",
      atributos: { "aria-live": "polite" },
    });
    document.body.append(contenedorNotificaciones);
  }

  return contenedorNotificaciones;
}

export function mostrarNotificacion({ titulo = "Aviso", mensaje = "", tipo = "informacion" } = {}) {
  const notificacion = crearElemento("div", { clases: ["notificacion", `notificacion--${tipo}`] }, [
    crearElemento("strong", { texto: titulo }),
    mensaje ? crearElemento("p", { texto: mensaje }) : null,
  ]);

  obtenerContenedor().append(notificacion);
  window.setTimeout(() => notificacion.remove(), 5200);
}
