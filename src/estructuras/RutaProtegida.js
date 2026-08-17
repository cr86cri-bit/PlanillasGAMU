import { usuarioTieneAlgunoDeLosPermisos } from "../nucleo/autenticacion/permisos.js";
import { PanelError } from "../componentes/Error/PanelError.js";

export function RutaProtegida({ usuarioActual, permisos = [], contenido }) {
  if (!usuarioTieneAlgunoDeLosPermisos(usuarioActual, permisos)) {
    return PanelError({
      titulo: "Acceso restringido",
      detalle: "Tu usuario no tiene permisos para ver este módulo.",
    });
  }

  return contenido;
}
