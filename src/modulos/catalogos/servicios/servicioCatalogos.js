import {
  actualizarRegistro,
  crearRegistro,
  listarRegistros,
} from "../../../nucleo/datos/servicioDatos.js";

export async function listarUnidadesActivas() {
  const resultado = await listarRegistros({
    tabla: "unidades",
    columnas: "id_unidad,codigo,nombre,descripcion,activo",
    pagina: 1,
    tamanoPagina: 200,
    orden: "nombre",
    ascendente: true,
    filtros: { activo: true },
  });

  return resultado.filas;
}

export async function listarCargosActivos() {
  const resultado = await listarRegistros({
    tabla: "cargos",
    columnas: "id_cargo,nombre,descripcion,activo",
    pagina: 1,
    tamanoPagina: 200,
    orden: "nombre",
    ascendente: true,
    filtros: { activo: true },
  });

  return resultado.filas;
}

export function crearRegistroCatalogo(tabla, datos) {
  return crearRegistro(tabla, datos);
}

export function actualizarRegistroCatalogo(tabla, columnaId, id, datos) {
  return actualizarRegistro(tabla, columnaId, id, datos);
}
