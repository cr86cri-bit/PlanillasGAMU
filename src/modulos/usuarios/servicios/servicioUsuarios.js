import { invocarFuncion } from "../../../nucleo/http/clienteHttp.js";
import { listarRegistros } from "../../../nucleo/datos/servicioDatos.js";

export function listarUsuarios(opciones = {}) {
  return listarRegistros({
    tabla: "perfiles",
    columnas: "id_perfil,id_usuario,correo,nombre_mostrado,estado,fecha_creacion",
    orden: "correo",
    ascendente: true,
    columnasBusqueda: ["correo", "nombre_mostrado", "estado"],
    ...opciones,
  });
}

export function crearUsuario(datos) {
  return invocarFuncion("crear-usuario", datos);
}

export function actualizarUsuario(datos) {
  return invocarFuncion("actualizar-usuario", datos);
}

export function desactivarUsuario(idUsuario) {
  return invocarFuncion("desactivar-usuario", { id_usuario: idUsuario });
}
