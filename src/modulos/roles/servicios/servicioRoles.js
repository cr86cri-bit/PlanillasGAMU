import { invocarFuncion } from "../../../nucleo/http/clienteHttp.js";
import { listarRegistros } from "../../../nucleo/datos/servicioDatos.js";

export function listarRoles(opciones = {}) {
  return listarRegistros({
    tabla: "roles",
    columnas: "id_rol,nombre,descripcion,activo,fecha_creacion",
    orden: "nombre",
    ascendente: true,
    columnasBusqueda: ["nombre", "descripcion"],
    ...opciones,
  });
}

export function asignarRol(idUsuario, idRol) {
  return invocarFuncion("asignar-rol", { id_usuario: idUsuario, id_rol: idRol });
}
