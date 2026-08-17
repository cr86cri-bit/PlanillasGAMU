import { PaginaIngreso } from "../modulos/autenticacion/PaginaIngreso.js";
import { PaginaInicio } from "../modulos/inicio/PaginaInicio.js";
import { PaginaFuncionarios } from "../modulos/funcionarios/PaginaFuncionarios.js";
import { crearPaginaCatalogo } from "../modulos/crearPaginaCatalogo.js";
import { PaginaHorarios } from "../modulos/horarios/PaginaHorarios.js";
import { PaginaImportaciones } from "../modulos/importaciones/PaginaImportaciones.js";
import { PaginaAsistencia } from "../modulos/asistencia/PaginaAsistencia.js";
import { PaginaUsuarios } from "../modulos/usuarios/PaginaUsuarios.js";
import { PaginaRoles } from "../modulos/roles/PaginaRoles.js";
import { PaginaConfiguracion } from "../modulos/configuracion/PaginaConfiguracion.js";
import { listarFuncionariosActivos } from "../modulos/funcionarios/servicios/servicioFuncionarios.js";
import { formatearFecha, formatearMinutos, textoSeguro } from "../utilidades/dom.js";

const campoActivo = {
  clave: "activo",
  etiqueta: "Estado",
  tipo: "booleano",
  valorInicial: true,
  opciones: [
    { valor: true, etiqueta: "Activo" },
    { valor: false, etiqueta: "Inactivo" },
  ],
};

const campoAplica = {
  clave: "aplica",
  etiqueta: "Aplica",
  tipo: "booleano",
  valorInicial: true,
  opciones: [
    { valor: true, etiqueta: "Si aplica" },
    { valor: false, etiqueta: "No aplica" },
  ],
};

function etiquetaFuncionario(funcionario) {
  const nombre = textoSeguro(funcionario?.nombre_completo, "Sin nombre");
  const carnet = funcionario?.carnet_identidad ? ` - CI ${funcionario.carnet_identidad}` : "";

  return `${nombre}${carnet}`;
}

async function cargarOpcionesFuncionarios() {
  const { filas } = await listarFuncionariosActivos();

  return {
    funcionarios: filas.map((funcionario) => ({
      valor: funcionario.id_funcionario,
      etiqueta: etiquetaFuncionario(funcionario),
    })),
  };
}

function sumarDiasIso(fecha, dias) {
  if (!fecha) {
    return null;
  }

  const objeto = new Date(`${fecha}T00:00:00`);
  objeto.setDate(objeto.getDate() + dias);
  return objeto.toISOString().slice(0, 10);
}

function textoOrigenHoraExtra(fila) {
  return fila.origen === "AUTOMATICO" ? "Automatica" : "Manual";
}

function textoToleranciaHoraExtra(fila) {
  if (!fila.aprobado || fila.estado !== "APROBADO") {
    return "Sin aplicar";
  }

  return `${formatearMinutos(fila.minutos_tolerancia_otorgados ?? 30)} el ${formatearFecha(
    fila.fecha_aplicacion,
  )}`;
}

function prepararHoraExtra(datos, fila, { usuarioActual } = {}) {
  const aprobado = Boolean(datos.aprobado);
  const fechaAplicacion = datos.fecha_aplicacion || sumarDiasIso(datos.fecha_hora_extra, 1);
  const estado = aprobado ? "APROBADO" : datos.estado === "APROBADO" ? "PENDIENTE" : datos.estado;

  return {
    ...datos,
    origen: datos.origen || fila?.origen || "MANUAL",
    aprobado,
    estado,
    trasladar_siguiente_laboral: false,
    fecha_aplicacion: fechaAplicacion,
    fecha_aprobacion: aprobado ? (fila?.fecha_aprobacion ?? new Date().toISOString()) : null,
    aprobado_por: aprobado ? (fila?.aprobado_por ?? usuarioActual?.id ?? null) : null,
  };
}

const campoFuncionario = {
  clave: "id_funcionario",
  etiqueta: "Funcionario",
  tipo: "select",
  fuenteOpciones: "funcionarios",
  placeholder: "Selecciona un funcionario activo",
  requerido: true,
  ayuda: "Si la lista esta vacia, crea o activa primero un funcionario.",
};

export const rutasPublicas = [
  {
    ruta: "/ingreso",
    titulo: "Inicio de sesión",
    renderizar: PaginaIngreso,
  },
];

export const rutasProtegidas = [
  {
    ruta: "/inicio",
    titulo: "Panel principal",
    etiqueta: "Inicio",
    icono: "inicio",
    permisos: [],
    renderizar: PaginaInicio,
  },
  {
    ruta: "/funcionarios",
    titulo: "Funcionarios",
    etiqueta: "Funcionarios",
    icono: "funcionario",
    permisos: ["funcionarios.ver"],
    renderizar: PaginaFuncionarios,
  },
  {
    ruta: "/cargos",
    titulo: "Cargos",
    etiqueta: "Cargos",
    icono: "catalogo",
    permisos: ["funcionarios.ver"],
    renderizar: crearPaginaCatalogo({
      titulo: "Cargos",
      descripcion: "Catálogo de cargos institucionales.",
      tabla: "cargos",
      columnaId: "id_cargo",
      permisoGestion: "funcionarios.editar",
      columnasBusqueda: ["nombre", "descripcion"],
      camposFormulario: [
        { clave: "nombre", etiqueta: "Nombre del cargo", requerido: true },
        { clave: "descripcion", etiqueta: "Descripcion", tipo: "textarea" },
        campoActivo,
      ],
    }),
  },
  {
    ruta: "/unidades",
    titulo: "Unidades",
    etiqueta: "Unidades",
    icono: "unidad",
    permisos: ["funcionarios.ver"],
    renderizar: crearPaginaCatalogo({
      titulo: "Unidades",
      descripcion: "Unidades organizacionales del Gobierno Autónomo Municipal de Uyuni.",
      tabla: "unidades",
      columnaId: "id_unidad",
      permisoGestion: "funcionarios.editar",
      columnasBusqueda: ["nombre", "codigo"],
      columnasTabla: [
        { titulo: "Codigo", renderizar: (fila) => textoSeguro(fila.codigo) },
        { titulo: "Nombre", clave: "nombre" },
        { titulo: "Descripcion", renderizar: (fila) => textoSeguro(fila.descripcion) },
        { titulo: "Estado", renderizar: (fila) => (fila.activo ? "Activo" : "Inactivo") },
      ],
      camposFormulario: [
        { clave: "codigo", etiqueta: "Codigo", requerido: true },
        { clave: "nombre", etiqueta: "Nombre de la unidad", requerido: true },
        { clave: "descripcion", etiqueta: "Descripcion", tipo: "textarea" },
        campoActivo,
      ],
    }),
  },
  {
    ruta: "/horarios",
    titulo: "Horarios",
    etiqueta: "Horarios",
    icono: "reloj",
    permisos: ["horarios.gestionar"],
    renderizar: PaginaHorarios,
  },
  {
    ruta: "/excepciones",
    titulo: "Excepciones",
    etiqueta: "Excepciones",
    icono: "excepcion",
    permisos: ["excepciones.gestionar"],
    renderizar: crearPaginaCatalogo({
      titulo: "Excepciones",
      descripcion: "Permisos, vacaciones, comisiones, bajas médicas y tolerancias especiales.",
      tabla: "excepciones_funcionario",
      columnaId: "id_excepcion",
      permisoGestion: "excepciones.gestionar",
      columnasBusqueda: ["tipo", "motivo", "estado"],
      columnasConsulta: "*, funcionarios(nombre_completo, carnet_identidad)",
      cargarOpcionesFormulario: cargarOpcionesFuncionarios,
      columnasTabla: [
        { titulo: "Funcionario", renderizar: (fila) => etiquetaFuncionario(fila.funcionarios) },
        { titulo: "Tipo", clave: "tipo" },
        { titulo: "Desde", renderizar: (fila) => formatearFecha(fila.fecha_desde) },
        { titulo: "Hasta", renderizar: (fila) => formatearFecha(fila.fecha_hasta) },
        { titulo: "Motivo", renderizar: (fila) => textoSeguro(fila.motivo) },
        { titulo: "Estado", clave: "estado" },
      ],
      camposFormulario: [
        campoFuncionario,
        {
          clave: "tipo",
          etiqueta: "Tipo",
          tipo: "select",
          requerido: true,
          opciones: [
            { valor: "PERMISO", etiqueta: "Permiso" },
            { valor: "VACACION", etiqueta: "Vacacion" },
            { valor: "BAJA_MEDICA", etiqueta: "Baja medica" },
            { valor: "COMISION", etiqueta: "Comision" },
            { valor: "DIA_NO_LABORABLE", etiqueta: "Dia no laborable" },
            { valor: "OTRA", etiqueta: "Otra" },
          ],
        },
        { clave: "fecha_desde", etiqueta: "Fecha desde", tipo: "date", requerido: true },
        { clave: "fecha_hasta", etiqueta: "Fecha hasta", tipo: "date", requerido: true },
        { clave: "motivo", etiqueta: "Motivo", tipo: "textarea", requerido: true },
        {
          clave: "estado",
          etiqueta: "Estado",
          tipo: "select",
          valorInicial: "APROBADO",
          opciones: [
            { valor: "PENDIENTE", etiqueta: "Pendiente" },
            { valor: "APROBADO", etiqueta: "Aprobado" },
            { valor: "RECHAZADO", etiqueta: "Rechazado" },
            { valor: "ANULADO", etiqueta: "Anulado" },
          ],
        },
      ],
      campoActivacion: null,
    }),
  },
  {
    ruta: "/feriados",
    titulo: "Feriados",
    etiqueta: "Feriados",
    icono: "calendario",
    permisos: ["feriados.gestionar"],
    renderizar: crearPaginaCatalogo({
      titulo: "Feriados",
      descripcion: "Días feriados aplicables al cálculo de asistencia.",
      tabla: "feriados",
      columnaId: "id_feriado",
      permisoGestion: "feriados.gestionar",
      columnasBusqueda: ["nombre", "alcance", "observacion"],
      columnasTabla: [
        { titulo: "Fecha", renderizar: (fila) => formatearFecha(fila.fecha) },
        { titulo: "Nombre", clave: "nombre" },
        { titulo: "Alcance", clave: "alcance" },
        { titulo: "Aplica", renderizar: (fila) => (fila.aplica ? "Si" : "No") },
      ],
      camposFormulario: [
        { clave: "fecha", etiqueta: "Fecha", tipo: "date", requerido: true },
        { clave: "nombre", etiqueta: "Nombre del feriado", requerido: true },
        {
          clave: "alcance",
          etiqueta: "Alcance",
          tipo: "select",
          valorInicial: "MUNICIPAL",
          opciones: [
            { valor: "NACIONAL", etiqueta: "Nacional" },
            { valor: "DEPARTAMENTAL", etiqueta: "Departamental" },
            { valor: "MUNICIPAL", etiqueta: "Municipal" },
          ],
        },
        { clave: "observacion", etiqueta: "Observacion", tipo: "textarea" },
        campoAplica,
      ],
      campoActivacion: "aplica",
    }),
  },
  {
    ruta: "/horas-extras",
    titulo: "Horas extras",
    etiqueta: "Horas extras",
    icono: "extra",
    permisos: ["horas_extras.gestionar"],
    renderizar: crearPaginaCatalogo({
      titulo: "Horas extras",
      descripcion:
        "Registro y aprobación de horas extras con tolerancia del siguiente día laboral.",
      tabla: "registros_horas_extra",
      columnaId: "id_hora_extra",
      permisoGestion: "horas_extras.gestionar",
      columnasBusqueda: ["motivo", "estado"],
      columnasConsulta: "*, funcionarios(nombre_completo, carnet_identidad)",
      cargarOpcionesFormulario: cargarOpcionesFuncionarios,
      columnasTabla: [
        { titulo: "Funcionario", renderizar: (fila) => etiquetaFuncionario(fila.funcionarios) },
        { titulo: "Fecha", renderizar: (fila) => formatearFecha(fila.fecha_hora_extra) },
        { titulo: "Minutos", clave: "minutos_trabajados" },
        { titulo: "Origen", renderizar: (fila) => textoOrigenHoraExtra(fila) },
        { titulo: "Tolerancia", renderizar: (fila) => textoToleranciaHoraExtra(fila) },
        { titulo: "Motivo", renderizar: (fila) => textoSeguro(fila.motivo) },
        { titulo: "Estado", clave: "estado" },
      ],
      camposFormulario: [
        campoFuncionario,
        { clave: "fecha_hora_extra", etiqueta: "Fecha", tipo: "date", requerido: true },
        {
          clave: "origen",
          etiqueta: "Origen",
          tipo: "select",
          valorInicial: "MANUAL",
          opciones: [
            { valor: "MANUAL", etiqueta: "Manual" },
            { valor: "AUTOMATICO", etiqueta: "Automatico" },
          ],
        },
        {
          clave: "minutos_trabajados",
          etiqueta: "Minutos trabajados",
          tipo: "numero",
          requerido: true,
          valorInicial: 0,
        },
        {
          clave: "aprobado",
          etiqueta: "Aplicar tolerancia de media hora",
          tipo: "checkbox",
          valorInicial: false,
          ayuda:
            "Al marcarlo se aplica la tolerancia solo en la fecha indicada, normalmente el dia siguiente.",
        },
        {
          clave: "fecha_aplicacion",
          etiqueta: "Fecha de tolerancia",
          tipo: "date",
          nuloSiVacio: true,
          ayuda: "El calculo automatico usa siempre el dia calendario siguiente.",
        },
        {
          clave: "minutos_tolerancia_otorgados",
          etiqueta: "Minutos de tolerancia",
          tipo: "numero",
          valorInicial: 30,
        },
        { clave: "motivo", etiqueta: "Motivo", tipo: "textarea" },
        {
          clave: "estado",
          etiqueta: "Estado",
          tipo: "select",
          valorInicial: "PENDIENTE",
          opciones: [
            { valor: "PENDIENTE", etiqueta: "Pendiente" },
            { valor: "APROBADO", etiqueta: "Aprobado" },
            { valor: "RECHAZADO", etiqueta: "Rechazado" },
            { valor: "CONSUMIDO", etiqueta: "Consumido" },
          ],
        },
      ],
      campoActivacion: null,
      prepararDatosGuardar: prepararHoraExtra,
    }),
  },
  {
    ruta: "/importaciones",
    titulo: "Importaciones",
    etiqueta: "Importaciones",
    icono: "importar",
    permisos: ["importaciones.crear", "importaciones.ver"],
    renderizar: PaginaImportaciones,
  },
  {
    ruta: "/asistencia",
    titulo: "Asistencia individual",
    etiqueta: "Asistencia",
    icono: "asistencia",
    permisos: ["asistencia.ver"],
    renderizar: PaginaAsistencia,
  },
  {
    ruta: "/reportes",
    titulo: "Asistencia individual",
    etiqueta: "Reportes",
    icono: "reporte",
    permisos: ["reportes.generar"],
    oculta: true,
    renderizar: PaginaAsistencia,
  },
  {
    ruta: "/usuarios",
    titulo: "Usuarios",
    etiqueta: "Usuarios",
    icono: "usuarios",
    permisos: ["usuarios.gestionar"],
    renderizar: PaginaUsuarios,
  },
  {
    ruta: "/roles",
    titulo: "Roles y permisos",
    etiqueta: "Roles",
    icono: "roles",
    permisos: ["roles.gestionar"],
    renderizar: PaginaRoles,
  },
  {
    ruta: "/configuracion",
    titulo: "Configuración",
    etiqueta: "Configuración",
    icono: "configurar",
    permisos: ["configuracion.gestionar"],
    renderizar: PaginaConfiguracion,
  },
];

export const rutas = [...rutasPublicas, ...rutasProtegidas];

export function buscarRuta(rutaSolicitada) {
  return rutas.find((ruta) => ruta.ruta === rutaSolicitada) ?? rutasProtegidas[0];
}
