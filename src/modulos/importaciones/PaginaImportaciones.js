import { crearElemento, limpiarNodo, formatearFecha, textoSeguro } from "../../utilidades/dom.js";
import { Boton } from "../../componentes/Boton/Boton.js";
import { confirmarAccion } from "../../componentes/DialogoConfirmacion/DialogoConfirmacion.js";
import { EtiquetaEstado } from "../../componentes/EtiquetaEstado/EtiquetaEstado.js";
import { Icono } from "../../componentes/Icono/Icono.js";
import { IndicadorCarga } from "../../componentes/IndicadorCarga/IndicadorCarga.js";
import { PanelError } from "../../componentes/Error/PanelError.js";
import { mostrarNotificacion } from "../../componentes/Notificacion/Notificacion.js";
import { Selector } from "../../componentes/Selector/Selector.js";
import { SelectorPeriodo } from "../../componentes/SelectorFecha/SelectorFecha.js";
import { TablaDatos } from "../../componentes/TablaDatos/TablaDatos.js";
import { Tarjeta } from "../../componentes/Tarjeta/Tarjeta.js";
import { crearControladorImportaciones } from "./controladores/controladorImportaciones.js";

function clavePeriodo(anio, mes) {
  return `${anio}-${String(mes).padStart(2, "0")}`;
}

function formatearResumenMeses(resumenPorMes = {}) {
  return Object.entries(resumenPorMes)
    .sort(([mesA], [mesB]) => mesA.localeCompare(mesB))
    .map(([mes, total]) => `${mes}: ${total}`)
    .join(" · ");
}

function formatearFechaHora(valor) {
  if (!valor) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(valor));
}

function textoPeriodoImportacion(importacion) {
  if (importacion.fecha_minima && importacion.fecha_maxima) {
    return `${formatearFecha(importacion.fecha_minima)} a ${formatearFecha(importacion.fecha_maxima)}`;
  }

  return `${importacion.anio}-${String(importacion.mes).padStart(2, "0")}`;
}

function textoUnidad(importacion) {
  const unidad = importacion.unidades;

  if (!unidad) {
    return "Sin unidad";
  }

  return unidad.codigo ? `${unidad.codigo} - ${unidad.nombre}` : unidad.nombre;
}

function textoDetalleImportacion(importacion) {
  const partes = [`${Number(importacion.total_marcaciones ?? 0)} registros`];

  if (Number(importacion.filas_invalidas ?? 0) > 0) {
    partes.push(`${importacion.filas_invalidas} inválidos`);
  }

  if (importacion.estado === "REVERTIDO") {
    const rollback = importacion.resumen?.rollback;
    partes.push(
      rollback
        ? `Rollback: ${rollback.marcaciones_eliminadas ?? 0} marcaciones eliminadas`
        : "Rollback aplicado",
    );
  }

  return partes.join(" · ");
}

export function PaginaImportaciones({ envolverProtegida, ruta } = {}) {
  const controlador = crearControladorImportaciones();
  const contenedor = crearElemento("main", { clases: "pagina" });
  const rollbackHabilitado = false;

  const ejecutarPrevisualizacion = async () => {
    await controlador.previsualizar();
    renderizar();
  };

  const confirmar = async () => {
    await controlador.confirmar();
    renderizar();

    if (!controlador.estado.error) {
      mostrarNotificacion({
        titulo: "Importación completada",
        mensaje: "El Excel fue cargado y recalculado correctamente.",
        tipo: "exito",
      });
    }
  };

  const recalcularImportacion = async (importacion) => {
    const correcto = await controlador.recalcularImportacion(importacion.id_importacion);
    renderizar();

    if (correcto) {
      mostrarNotificacion({
        titulo: "Importación recalculada",
        mensaje: `${importacion.nombre_archivo} se procesó nuevamente.`,
        tipo: "exito",
      });
    }
  };

  const revertirImportacion = async (importacion) => {
    const confirmado = await confirmarAccion({
      titulo: "Revertir importación",
      mensaje: `Se eliminarán las marcaciones y cálculos generados por ${importacion.nombre_archivo}. Esta acción quedará registrada en auditoría.`,
      textoConfirmar: "Revertir",
      variante: "peligro",
    });

    if (!confirmado) {
      return;
    }

    const correcto = await controlador.revertirImportacion(importacion.id_importacion);
    renderizar();

    if (correcto) {
      mostrarNotificacion({
        titulo: "Importación revertida",
        mensaje: `${importacion.nombre_archivo} fue revertido correctamente.`,
        tipo: "exito",
      });
    }
  };

  const crearFuncionariosFaltantes = async () => {
    const creados = await controlador.crearFuncionariosFaltantes();
    renderizar();

    if (creados > 0) {
      mostrarNotificacion({
        titulo: "Funcionarios creados",
        mensaje: `Se crearon ${creados} funcionarios desde el Excel.`,
        tipo: "exito",
      });
    }
  };

  const cargarUnidades = async () => {
    await controlador.cargarUnidades();
    renderizar();
  };

  const cargarHistorial = async () => {
    await controlador.cargarHistorial();
    renderizar();
  };

  function crearSelectorArchivo() {
    const entrada = crearElemento("input", {
      atributos: { id: "archivo-excel", type: "file", accept: ".xlsx,.xls,.csv", required: true },
      eventos: {
        change: (evento) => {
          controlador.establecerArchivo(evento.target.files?.[0] ?? null);
          renderizar();
        },
      },
    });

    return crearElemento("div", { clases: "importacion-archivo" }, [
      entrada,
      crearElemento("label", { clases: "importacion-archivo__drop", atributos: { for: "archivo-excel" } }, [
        crearElemento("span", { clases: "importacion-archivo__icono" }, [
          Icono({ nombre: "importar" }),
        ]),
        crearElemento("strong", { texto: "Seleccione el archivo aquí" }),
        crearElemento("span", { texto: "Formato requerido: .xlsx, .xls o .csv" }),
      ]),
      controlador.estado.archivo
        ? crearElemento("span", {
            clases: "campo__ayuda",
            texto: `Archivo seleccionado: ${controlador.estado.archivo.name}`,
          })
        : null,
      crearElemento("span", {
        clases: "campo__ayuda",
        texto:
          "Columnas esperadas: Número, Nombre, Tiempo, Estado, Dispositivos y Tipo de Registro.",
      }),
    ]);
  }

  function renderizarHistorial() {
    const { estado } = controlador;

    if (estado.estaCargandoHistorial) {
      return Tarjeta({
        titulo: "Importaciones recientes",
        cuerpo: IndicadorCarga({ texto: "Cargando historial..." }),
      });
    }

    const columnas = [
      {
        titulo: "Archivo",
        renderizar: (fila) =>
          crearElemento("div", { clases: "importacion-historial__archivo" }, [
            Icono({ nombre: "reporte" }),
            crearElemento("div", {}, [
              crearElemento("strong", { texto: textoSeguro(fila.nombre_archivo) }),
              crearElemento("span", { texto: textoUnidad(fila) }),
            ]),
          ]),
      },
      { titulo: "Fecha / hora", renderizar: (fila) => formatearFechaHora(fila.fecha_creacion) },
      {
        titulo: "Estado",
        renderizar: (fila) =>
          EtiquetaEstado({
            estado: fila.estado,
            texto: fila.estado === "REVERTIDO" ? "Revertido" : fila.estado,
          }),
      },
      {
        titulo: "Periodo",
        renderizar: (fila) => textoPeriodoImportacion(fila),
      },
      {
        titulo: "Detalles",
        renderizar: (fila) => textoDetalleImportacion(fila),
      },
      {
        titulo: "Acciones",
        renderizar: (fila) => {
          const estaRecalculando = estado.idImportacionRecalculando === fila.id_importacion;
          const estaRevirtiendo = estado.idImportacionRevirtiendo === fila.id_importacion;
          const estaOcupada = estaRecalculando || estaRevirtiendo || estado.estaProcesando;
          const estaRevertida = fila.estado === "REVERTIDO";

          return crearElemento("div", { clases: "acciones acciones--tabla acciones--compactas" }, [
            Boton({
              texto: estaRecalculando ? "Recalculando..." : "Recalcular",
              variante: "secundario",
              deshabilitado: estaOcupada || estaRevertida,
              alClick: () => recalcularImportacion(fila),
            }),
            Boton({
              texto: estaRevirtiendo
                ? "Revirtiendo..."
                : rollbackHabilitado
                  ? "Rollback"
                  : "Pendiente",
              variante: "peligro",
              titulo: rollbackHabilitado
                ? "Revertir importacion"
                : "Rollback pendiente de aprobacion para aplicar borrado en Cloudflare",
              deshabilitado: !rollbackHabilitado || estaOcupada || estaRevertida,
              alClick: () => revertirImportacion(fila),
            }),
          ]);
        },
      },
    ];

    return Tarjeta({
      titulo: "Importaciones recientes",
      acciones: Boton({
        texto: "Actualizar",
        variante: "secundario",
        icono: "buscar",
        deshabilitado: estado.estaCargandoHistorial,
        alClick: cargarHistorial,
      }),
      cuerpo: TablaDatos({
        columnas,
        filas: estado.historial,
        obtenerClave: (fila) => fila.id_importacion,
        mensajeVacio: "Todavía no hay importaciones registradas",
      }),
      pie: crearElemento("p", {
        clases: "texto-ayuda",
        texto:
          "Rollback elimina las marcaciones del Excel y limpia los cálculos de asistencia del rango afectado.",
      }),
    });
  }

  function renderizarResumen() {
    const { previsualizacion } = controlador.estado;

    if (!previsualizacion) {
      return null;
    }

    const periodoSeleccionado = clavePeriodo(previsualizacion.anio, previsualizacion.mes);
    const marcacionesPeriodoSeleccionado =
      previsualizacion.resumenPorMes?.[periodoSeleccionado] ?? 0;
    const contienePeriodoSeleccionado = marcacionesPeriodoSeleccionado > 0;
    const hayCodigosDesconocidos = previsualizacion.codigosDesconocidos.length > 0;
    const puedeConfirmar =
      previsualizacion.marcacionesValidas.length > 0 &&
      !hayCodigosDesconocidos &&
      !controlador.estado.estaProcesando &&
      !controlador.estado.estaCreandoFuncionarios;
    const primerosDesconocidos = previsualizacion.funcionariosDesconocidos.slice(0, 8);

    return Tarjeta({
      titulo: "Previsualización",
      cuerpo: [
        crearElemento("dl", { clases: "grilla-resumen" }, [
          crearElemento("div", {}, [
            crearElemento("dt", { texto: "Marcaciones válidas" }),
            crearElemento("dd", { texto: String(previsualizacion.marcacionesValidas.length) }),
          ]),
          crearElemento("div", {}, [
            crearElemento("dt", { texto: "Funcionarios encontrados" }),
            crearElemento("dd", { texto: String(previsualizacion.funcionarios.length) }),
          ]),
          crearElemento("div", {}, [
            crearElemento("dt", { texto: "Códigos del Excel" }),
            crearElemento("dd", { texto: String(previsualizacion.codigosEncontrados.length) }),
          ]),
          crearElemento("div", {}, [
            crearElemento("dt", { texto: "Códigos desconocidos" }),
            crearElemento("dd", { texto: String(previsualizacion.codigosDesconocidos.length) }),
          ]),
          crearElemento("div", {}, [
            crearElemento("dt", { texto: "Duplicados" }),
            crearElemento("dd", { texto: String(previsualizacion.duplicados.length) }),
          ]),
        ]),
        crearElemento("p", {
          clases: contienePeriodoSeleccionado ? "texto-ayuda" : "mensaje-error",
          texto: previsualizacion.periodoDetectado
            ? `Rango real detectado: ${previsualizacion.periodoDetectado.fecha_minima} a ${previsualizacion.periodoDetectado.fecha_maxima}. Distribución: ${formatearResumenMeses(previsualizacion.resumenPorMes)}.`
            : "No se detectó rango de fechas.",
        }),
        contienePeriodoSeleccionado
          ? crearElemento("p", {
              clases: "texto-ayuda",
              texto: `El periodo seleccionado ${periodoSeleccionado} tiene ${marcacionesPeriodoSeleccionado} marcaciones. Si tu planilla cierra de un mes a otro, este rango puede ser correcto.`,
            })
          : crearElemento("p", {
              clases: "mensaje-error",
              texto: `El Excel no contiene marcaciones para el periodo seleccionado ${periodoSeleccionado}.`,
            }),
        hayCodigosDesconocidos
          ? crearElemento("p", {
              clases: "mensaje-error",
              texto:
                "Hay códigos biométricos que todavía no existen en Funcionarios. Crea esos funcionarios antes de confirmar.",
            })
          : null,
        primerosDesconocidos.length
          ? crearElemento(
              "ul",
              { clases: "lista-compacta" },
              primerosDesconocidos.map((funcionario) =>
                crearElemento("li", {
                  texto: `${funcionario.codigo_biometrico} - ${funcionario.nombre_excel}`,
                }),
              ),
            )
          : null,
      ],
      pie: crearElemento("div", { clases: "acciones" }, [
        hayCodigosDesconocidos
          ? Boton({
              texto: controlador.estado.estaCreandoFuncionarios
                ? "Creando funcionarios..."
                : `Crear ${previsualizacion.codigosDesconocidos.length} funcionarios faltantes`,
              variante: "secundario",
              deshabilitado:
                controlador.estado.estaCreandoFuncionarios || controlador.estado.estaProcesando,
              alClick: crearFuncionariosFaltantes,
            })
          : null,
        Boton({
          texto: controlador.estado.estaProcesando ? "Procesando..." : "Confirmar importación",
          titulo: hayCodigosDesconocidos
            ? "Primero vincula o crea los funcionarios del Excel"
            : "Confirmar importación",
          deshabilitado: !puedeConfirmar,
          alClick: confirmar,
        }),
      ]),
    });
  }

  function renderizar() {
    const { estado } = controlador;
    limpiarNodo(contenedor);
    const resumen = renderizarResumen();
    const opcionesUnidad = [
      {
        valor: "",
        etiqueta: estado.unidades.length ? "Selecciona una unidad" : "Sin unidades activas",
      },
      ...estado.unidades.map((unidad) => ({
        valor: unidad.id_unidad,
        etiqueta: unidad.codigo ? `${unidad.codigo} - ${unidad.nombre}` : unidad.nombre,
      })),
    ];
    const selectoresPeriodo = SelectorPeriodo({
      anio: estado.anio,
      mes: estado.mes,
      alCambiarAnio: (valor) => {
        controlador.establecerPeriodo(valor, estado.mes);
        renderizar();
      },
      alCambiarMes: (valor) => {
        controlador.establecerPeriodo(estado.anio, valor);
        renderizar();
      },
    });

    contenedor.append(
      crearElemento("section", { clases: "pagina__cabecera" }, [
        crearElemento("div", { clases: "pagina__titulo" }, [
          crearElemento("h2", { texto: "Importaciones Excel" }),
          crearElemento("p", {
            texto:
              "Lectura local, validación, previsualización y carga por lotes de marcaciones biométricas.",
          }),
        ]),
      ]),
      crearElemento("section", { clases: "importaciones-layout" }, [
        Tarjeta({
          titulo: "Nueva importación",
          cuerpo: [
            crearElemento("div", { clases: "formulario" }, [
              crearSelectorArchivo(),
              crearElemento("div", { clases: "formulario__fila" }, selectoresPeriodo),
              Selector({
                id: "id-unidad-importacion",
                etiqueta: "Unidad",
                valor: estado.idUnidad,
                opciones: opcionesUnidad,
                requerido: true,
                deshabilitado: !estado.unidades.length,
                alCambiar: (valor) => {
                  controlador.establecerUnidad(valor);
                  renderizar();
                },
              }),
              crearElemento("span", {
                clases: "campo__ayuda",
                texto:
                  "La unidad evita importar dos veces el mismo periodo y permite filtrar reportes.",
              }),
              estado.error ? PanelError({ detalle: estado.error }) : null,
              estado.estaLeyendo ? IndicadorCarga({ texto: "Leyendo archivo..." }) : null,
            ]),
          ],
          pie: Boton({
            texto: "Previsualizar",
            deshabilitado: estado.estaLeyendo,
            alClick: ejecutarPrevisualizacion,
          }),
        }),
        renderizarHistorial(),
      ]),
    );

    if (resumen) {
      contenedor.append(resumen);
    }
  }

  renderizar();
  cargarUnidades();
  cargarHistorial();
  return envolverProtegida(contenedor, ruta);
}
