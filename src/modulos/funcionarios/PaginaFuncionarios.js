import { usuarioTienePermisoLocal } from "../../nucleo/autenticacion/permisos.js";
import { traducirError } from "../../nucleo/errores/manejadorErrores.js";
import { crearElemento, limpiarNodo, formatearFecha, textoSeguro } from "../../utilidades/dom.js";
import { crearAntirebote } from "../../utilidades/consultas.js";
import { BarraFiltros } from "../../componentes/BarraFiltros/BarraFiltros.js";
import { Boton } from "../../componentes/Boton/Boton.js";
import { EtiquetaEstado } from "../../componentes/EtiquetaEstado/EtiquetaEstado.js";
import { IndicadorCarga } from "../../componentes/IndicadorCarga/IndicadorCarga.js";
import { Modal } from "../../componentes/Modal/Modal.js";
import { mostrarNotificacion } from "../../componentes/Notificacion/Notificacion.js";
import { Paginacion } from "../../componentes/Paginacion/Paginacion.js";
import { PanelError } from "../../componentes/Error/PanelError.js";
import { TablaDatos } from "../../componentes/TablaDatos/TablaDatos.js";
import { Tarjeta } from "../../componentes/Tarjeta/Tarjeta.js";
import { crearControladorFuncionarios } from "./controladores/controladorFuncionarios.js";

function obtenerFechaActual() {
  return new Date().toISOString().slice(0, 10);
}

function crearCampoFormulario({ clave, etiqueta, tipo = "text", requerido = false, valor = "" }) {
  const idCampo = `${clave}-${crypto.randomUUID()}`;
  return crearElemento("div", { clases: "campo" }, [
    crearElemento("label", { atributos: { for: idCampo }, texto: etiqueta }),
    crearElemento("input", {
      atributos: {
        id: idCampo,
        name: clave,
        type: tipo,
        required: requerido,
        value: valor ?? "",
      },
    }),
  ]);
}

function crearSelectorFormulario({ clave, etiqueta, valor = "", opciones = [] }) {
  const idCampo = `${clave}-${crypto.randomUUID()}`;
  return crearElemento("div", { clases: "campo" }, [
    crearElemento("label", { atributos: { for: idCampo }, texto: etiqueta }),
    crearElemento(
      "select",
      { atributos: { id: idCampo, name: clave } },
      opciones.map((opcion) =>
        crearElemento("option", {
          texto: opcion.etiqueta,
          atributos: {
            value: opcion.valor,
            selected: String(opcion.valor) === String(valor ?? ""),
          },
        }),
      ),
    ),
  ]);
}

function leerFormularioFuncionario(formulario) {
  const valor = (clave) => String(formulario.elements.namedItem(clave)?.value ?? "").trim();

  return {
    carnet_identidad: valor("carnet_identidad"),
    codigo_biometrico: valor("codigo_biometrico"),
    nombres: valor("nombres"),
    apellido_paterno: valor("apellido_paterno"),
    apellido_materno: valor("apellido_materno") || null,
    id_cargo: valor("id_cargo") || null,
    id_unidad: valor("id_unidad") || null,
    fecha_ingreso: valor("fecha_ingreso"),
    estado: valor("estado") || "ACTIVO",
  };
}

export function PaginaFuncionarios({ envolverProtegida, ruta, usuarioActual } = {}) {
  const controlador = crearControladorFuncionarios();
  const contenedor = crearElemento("main", { clases: "pagina" });
  const puedeCrear = usuarioTienePermisoLocal(usuarioActual, "funcionarios.crear");
  const puedeEditar = usuarioTienePermisoLocal(usuarioActual, "funcionarios.editar");

  const cargar = async () => {
    await controlador.cargarFuncionarios();
    renderizar();
  };

  const buscarConEspera = crearAntirebote((valor) => {
    controlador.establecerBusqueda(valor);
    cargar();
  });

  const guardarFormulario = async (formulario, modal, funcionario = null) => {
    try {
      await controlador.guardarFuncionario(leerFormularioFuncionario(formulario), funcionario);
      modal.remove();
      mostrarNotificacion({
        titulo: funcionario ? "Funcionario actualizado" : "Funcionario registrado",
        mensaje: "Los datos se guardaron correctamente.",
        tipo: "exito",
      });
      await cargar();
    } catch (error) {
      mostrarNotificacion({
        titulo: "No se pudo guardar",
        mensaje: traducirError(error),
        tipo: "error",
      });
    }
  };

  const abrirFormulario = (funcionario = null) => {
    const { estado } = controlador;
    const opcionesCargos = [
      { valor: "", etiqueta: "Sin cargo asignado" },
      ...estado.cargos.map((cargo) => ({ valor: cargo.id_cargo, etiqueta: cargo.nombre })),
    ];
    const opcionesUnidades = [
      { valor: "", etiqueta: "Sin unidad asignada" },
      ...estado.unidades.map((unidad) => ({
        valor: unidad.id_unidad,
        etiqueta: unidad.codigo ? `${unidad.codigo} - ${unidad.nombre}` : unidad.nombre,
      })),
    ];
    const formulario = crearElemento("form", { clases: "formulario" }, [
      crearElemento("div", { clases: "formulario__fila" }, [
        crearCampoFormulario({
          clave: "carnet_identidad",
          etiqueta: "Carnet de identidad",
          requerido: true,
          valor: funcionario?.carnet_identidad,
        }),
        crearCampoFormulario({
          clave: "codigo_biometrico",
          etiqueta: "Codigo biometrico",
          requerido: true,
          valor: funcionario?.codigo_biometrico,
        }),
      ]),
      crearElemento("div", { clases: "formulario__fila" }, [
        crearCampoFormulario({
          clave: "nombres",
          etiqueta: "Nombres",
          requerido: true,
          valor: funcionario?.nombres,
        }),
        crearCampoFormulario({
          clave: "apellido_paterno",
          etiqueta: "Apellido paterno",
          requerido: true,
          valor: funcionario?.apellido_paterno,
        }),
      ]),
      crearElemento("div", { clases: "formulario__fila" }, [
        crearCampoFormulario({
          clave: "apellido_materno",
          etiqueta: "Apellido materno",
          valor: funcionario?.apellido_materno,
        }),
        crearCampoFormulario({
          clave: "fecha_ingreso",
          etiqueta: "Fecha de ingreso",
          tipo: "date",
          requerido: true,
          valor: funcionario?.fecha_ingreso ?? obtenerFechaActual(),
        }),
      ]),
      crearElemento("div", { clases: "formulario__fila" }, [
        crearSelectorFormulario({
          clave: "id_cargo",
          etiqueta: "Cargo",
          valor: funcionario?.id_cargo,
          opciones: opcionesCargos,
        }),
        crearSelectorFormulario({
          clave: "id_unidad",
          etiqueta: "Unidad",
          valor: funcionario?.id_unidad,
          opciones: opcionesUnidades,
        }),
      ]),
      crearSelectorFormulario({
        clave: "estado",
        etiqueta: "Estado",
        valor: funcionario?.estado ?? "ACTIVO",
        opciones: [
          { valor: "ACTIVO", etiqueta: "Activo" },
          { valor: "INACTIVO", etiqueta: "Inactivo" },
        ],
      }),
    ]);

    let modal;
    formulario.addEventListener("submit", async (evento) => {
      evento.preventDefault();
      await guardarFormulario(formulario, modal, funcionario);
    });

    modal = Modal({
      titulo: funcionario ? "Editar funcionario" : "Registrar funcionario",
      cuerpo: formulario,
      pie: [
        Boton({ texto: "Cancelar", variante: "secundario", alClick: () => modal.remove() }),
        Boton({ texto: "Guardar", icono: "✓", alClick: () => formulario.requestSubmit() }),
      ],
    });
  };

  const alternarEstado = async (funcionario) => {
    try {
      await controlador.alternarEstadoFuncionario(funcionario);
      await cargar();
    } catch (error) {
      mostrarNotificacion({
        titulo: "No se pudo cambiar el estado",
        mensaje: traducirError(error),
        tipo: "error",
      });
    }
  };

  function renderizar() {
    const { estado } = controlador;
    limpiarNodo(contenedor);

    contenedor.append(
      crearElemento("section", { clases: "pagina__cabecera" }, [
        crearElemento("div", { clases: "pagina__titulo" }, [
          crearElemento("h2", { texto: "Funcionarios" }),
          crearElemento("p", {
            texto:
              "Personas cuya asistencia se controla; usuario de sistema y funcionario se gestionan por separado.",
          }),
        ]),
        Boton({
          texto: "Registrar",
          icono: "+",
          variante: "primario",
          deshabilitado: !puedeCrear,
          titulo: puedeCrear
            ? "Registrar funcionario"
            : "Necesitas permiso para crear funcionarios",
          alClick: () => abrirFormulario(),
        }),
      ]),
      BarraFiltros({
        valorBusqueda: estado.busqueda,
        alBuscar: buscarConEspera,
        alLimpiar: () => {
          controlador.establecerBusqueda("");
          cargar();
        },
      }),
      estado.estaCargando
        ? IndicadorCarga({ texto: "Cargando funcionarios..." })
        : estado.error
          ? PanelError({ detalle: estado.error })
          : Tarjeta({
              titulo: `${estado.total} funcionarios`,
              cuerpo: [
                TablaDatos({
                  filas: estado.filas,
                  obtenerClave: (fila) => fila.id_funcionario,
                  mensajeVacio: "Sin funcionarios registrados",
                  columnas: [
                    { titulo: "CI", clave: "carnet_identidad" },
                    { titulo: "Código biométrico", clave: "codigo_biometrico" },
                    { titulo: "Nombre completo", clave: "nombre_completo" },
                    { titulo: "Cargo", renderizar: (fila) => textoSeguro(fila.cargos?.nombre) },
                    { titulo: "Unidad", renderizar: (fila) => textoSeguro(fila.unidades?.nombre) },
                    { titulo: "Ingreso", renderizar: (fila) => formatearFecha(fila.fecha_ingreso) },
                    {
                      titulo: "Estado",
                      renderizar: (fila) => EtiquetaEstado({ estado: fila.estado }),
                    },
                    {
                      titulo: "Acciones",
                      renderizar: (fila) =>
                        crearElemento("div", { clases: "acciones acciones--tabla" }, [
                          Boton({
                            texto: "Editar",
                            variante: "secundario",
                            deshabilitado: !puedeEditar,
                            alClick: () => abrirFormulario(fila),
                          }),
                          Boton({
                            texto: fila.estado === "ACTIVO" ? "Desactivar" : "Activar",
                            variante: "secundario",
                            deshabilitado: !puedeEditar,
                            alClick: () => alternarEstado(fila),
                          }),
                        ]),
                    },
                  ],
                }),
              ],
              pie: Paginacion({
                pagina: estado.pagina,
                total: estado.total,
                tamanoPagina: estado.tamanoPagina,
                alCambiar: (pagina) => {
                  controlador.establecerPagina(pagina);
                  cargar();
                },
              }),
            }),
    );
  }

  renderizar();
  cargar();

  return envolverProtegida(contenedor, ruta);
}
