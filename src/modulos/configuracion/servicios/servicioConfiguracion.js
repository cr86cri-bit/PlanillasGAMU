import { actualizarRegistro, listarRegistros } from "../../../nucleo/datos/servicioDatos.js";

export function listarConfiguraciones(opciones = {}) {
  return listarRegistros({
    tabla: "configuraciones_sistema",
    columnas: "clave,valor,descripcion,fecha_actualizacion",
    orden: "clave",
    ascendente: true,
    columnasBusqueda: ["clave", "descripcion"],
    ...opciones,
  });
}

export function actualizarConfiguracion(clave, datos) {
  return actualizarRegistro("configuraciones_sistema", "clave", clave, datos);
}
