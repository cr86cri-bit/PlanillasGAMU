import { renderizarRuta, esRutaPublica, navegarA, obtenerRutaActual } from "./enrutador.js";
import { cerrarSesion, obtenerUsuarioActual } from "../nucleo/autenticacion/servicioSesion.js";
import { obtenerConfiguracionFaltante } from "../nucleo/configuracion/entorno.js";
import { limpiarNodo, crearElemento } from "../utilidades/dom.js";
import { IndicadorCarga } from "../componentes/IndicadorCarga/IndicadorCarga.js";
import { EstructuraPrincipal } from "../estructuras/EstructuraPrincipal.js";
import { RutaProtegida } from "../estructuras/RutaProtegida.js";

export function crearAplicacion(contenedor) {
  const estado = {
    usuarioActual: null,
    configuracionFaltante: obtenerConfiguracionFaltante(),
  };

  async function cargarUsuario() {
    limpiarNodo(contenedor);
    contenedor.append(
      crearElemento("main", { clases: "pagina" }, [
        IndicadorCarga({ texto: "Verificando sesión segura..." }),
      ]),
    );

    estado.usuarioActual = await obtenerUsuarioActual();
    aplicarRuta();
  }

  function aplicarRuta() {
    const rutaActual = obtenerRutaActual();

    if (!estado.usuarioActual && !esRutaPublica(rutaActual)) {
      navegarA("/ingreso");
      return;
    }

    if (estado.usuarioActual && esRutaPublica(rutaActual)) {
      navegarA("/inicio");
      return;
    }

    renderizarRuta(contenedor, {
      usuarioActual: estado.usuarioActual,
      configuracionFaltante: estado.configuracionFaltante,
      recargarUsuario: cargarUsuario,
      envolverProtegida: (contenido, ruta) =>
        EstructuraPrincipal({
          contenido: RutaProtegida({
            usuarioActual: estado.usuarioActual,
            permisos: ruta.permisos,
            contenido,
          }),
          ruta,
          usuarioActual: estado.usuarioActual,
          alCerrarSesion: async () => {
            await cerrarSesion();
            estado.usuarioActual = null;
            navegarA("/ingreso");
          },
        }),
    });
  }

  window.addEventListener("hashchange", aplicarRuta);
  cargarUsuario().catch((error) => {
    console.error(error);
    estado.usuarioActual = null;
    aplicarRuta();
  });
}
