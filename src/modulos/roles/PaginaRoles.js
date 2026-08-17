import { crearPaginaCatalogo } from "../crearPaginaCatalogo.js";

export const PaginaRoles = crearPaginaCatalogo({
  titulo: "Roles y permisos",
  descripcion: "Administración de roles editables y permisos granulares.",
  tabla: "roles",
  columnaId: "id_rol",
  permisoGestion: "roles.gestionar",
  columnasBusqueda: ["nombre", "descripcion"],
});
