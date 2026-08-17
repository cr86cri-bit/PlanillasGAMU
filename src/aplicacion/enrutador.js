import { buscarRuta, rutasPublicas } from "./rutas.js";
import { limpiarNodo } from "../utilidades/dom.js";

export function obtenerRutaActual() {
  const hash = window.location.hash.replace(/^#/, "");
  return hash || "/inicio";
}

export function navegarA(ruta) {
  if (obtenerRutaActual() === ruta) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }

  window.location.hash = ruta;
}

export function esRutaPublica(ruta) {
  return rutasPublicas.some((rutaPublica) => rutaPublica.ruta === ruta);
}

export function renderizarRuta(contenedor, contexto) {
  const rutaActual = obtenerRutaActual();
  const ruta = buscarRuta(rutaActual);

  limpiarNodo(contenedor);
  contenedor.append(ruta.renderizar({ ...contexto, ruta }));
}
