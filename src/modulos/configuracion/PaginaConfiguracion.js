import { crearPaginaCatalogo } from "../crearPaginaCatalogo.js";

export const PaginaConfiguracion = crearPaginaCatalogo({
  titulo: "Configuración",
  descripcion: "Parámetros institucionales, firmante y reglas generales.",
  tabla: "configuraciones_sistema",
  columnaId: "clave",
  permisoGestion: "configuracion.gestionar",
  columnasBusqueda: ["clave", "descripcion"],
});
