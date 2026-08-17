import {
  actualizarRegistro,
  crearRegistro,
  listarRegistros,
  obtenerRegistroPorId,
  seleccionarRegistros,
} from "../../../nucleo/datos/servicioDatos.js";
import { unirNombreFuncionario } from "../../../utilidades/texto.js";

const columnasFuncionario = `
  id_funcionario,
  carnet_identidad,
  codigo_biometrico,
  nombres,
  apellido_paterno,
  apellido_materno,
  nombre_completo,
  id_cargo,
  id_unidad,
  fecha_ingreso,
  estado,
  cargos(nombre),
  unidades(nombre),
  fecha_creacion
`;

export function listarFuncionarios(opciones = {}) {
  return listarRegistros({
    tabla: "funcionarios",
    columnas: columnasFuncionario,
    orden: "apellido_paterno",
    ascendente: true,
    columnasBusqueda: [
      "carnet_identidad",
      "codigo_biometrico",
      "nombres",
      "apellido_paterno",
      "apellido_materno",
    ],
    ...opciones,
  });
}

export function listarFuncionariosActivos() {
  return listarRegistros({
    tabla: "funcionarios",
    columnas: "id_funcionario, carnet_identidad, nombre_completo, estado",
    orden: "nombre_completo",
    ascendente: true,
    filtros: { estado: "ACTIVO" },
    tamanoPagina: 500,
  });
}

export function obtenerFuncionarioPorId(idFuncionario) {
  return obtenerRegistroPorId("funcionarios", "id_funcionario", idFuncionario, columnasFuncionario);
}

export async function buscarFuncionarioPorCarnet(carnetIdentidad) {
  return seleccionarRegistros({
    tabla: "funcionarios",
    columnas: columnasFuncionario,
    filtros: { carnet_identidad: carnetIdentidad },
    maybeSingle: true,
  });
}

function prepararDatosFuncionario(datos) {
  const datosPreparados = { ...datos };
  const cambiaNombre =
    Object.hasOwn(datosPreparados, "nombres") ||
    Object.hasOwn(datosPreparados, "apellido_paterno") ||
    Object.hasOwn(datosPreparados, "apellido_materno");

  if (cambiaNombre) {
    datosPreparados.nombre_completo = unirNombreFuncionario(datosPreparados);
  }

  return datosPreparados;
}

export function crearFuncionario(datos) {
  return crearRegistro("funcionarios", prepararDatosFuncionario(datos));
}

export function actualizarFuncionario(idFuncionario, datos) {
  return actualizarRegistro(
    "funcionarios",
    "id_funcionario",
    idFuncionario,
    prepararDatosFuncionario(datos),
  );
}

export function cambiarEstadoFuncionario(idFuncionario, estado) {
  return actualizarFuncionario(idFuncionario, { estado });
}
