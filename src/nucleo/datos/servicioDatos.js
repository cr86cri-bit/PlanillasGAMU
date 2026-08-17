import { solicitarApi } from "../api/clienteApi.js";

export async function listarRegistros({
  tabla,
  columnas = "*",
  pagina = 1,
  tamanoPagina = 20,
  orden = "fecha_creacion",
  ascendente = false,
  busqueda = "",
  columnasBusqueda = [],
  filtros = {},
  senal,
} = {}) {
  return solicitarApi("datos/listar", {
    metodo: "POST",
    senal,
    cuerpo: {
      tabla,
      columnas,
      pagina,
      tamanoPagina,
      orden,
      ascendente,
      busqueda,
      columnasBusqueda,
      filtros,
    },
  });
}

export async function obtenerRegistroPorId(tabla, columnaId, id, columnas = "*") {
  return solicitarApi("datos/obtener", {
    metodo: "POST",
    cuerpo: { tabla, columnaId, id, columnas },
  });
}

export async function crearRegistro(tabla, datos) {
  return solicitarApi("datos/crear", {
    metodo: "POST",
    cuerpo: { tabla, datos },
  });
}

export async function crearRegistros(tabla, datos) {
  return solicitarApi("datos/crear", {
    metodo: "POST",
    cuerpo: { tabla, datos },
  });
}

export async function actualizarRegistro(tabla, columnaId, id, datos) {
  return solicitarApi("datos/actualizar", {
    metodo: "POST",
    cuerpo: { tabla, columnaId, id, datos },
  });
}

export async function eliminarRegistro(tabla, columnaId, id) {
  return solicitarApi("datos/eliminar", {
    metodo: "POST",
    cuerpo: { tabla, columnaId, id },
  });
}

export async function seleccionarRegistros({
  tabla,
  columnas = "*",
  filtros = {},
  filtrosIn = {},
  filtrosGte = {},
  filtrosLte = {},
  notNull = [],
  orden,
  ascendente = true,
  limite,
  single = false,
  maybeSingle = false,
} = {}) {
  return solicitarApi("datos/seleccionar", {
    metodo: "POST",
    cuerpo: {
      tabla,
      columnas,
      filtros,
      filtrosIn,
      filtrosGte,
      filtrosLte,
      notNull,
      orden,
      ascendente,
      limite,
      single,
      maybeSingle,
    },
  });
}
