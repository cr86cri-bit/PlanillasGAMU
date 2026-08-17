import { crearElemento, limpiarNodo, formatearMinutos } from "../../utilidades/dom.js";
import { usuarioTienePermisoLocal } from "../../nucleo/autenticacion/permisos.js";
import { traducirError } from "../../nucleo/errores/manejadorErrores.js";
import { Boton } from "../../componentes/Boton/Boton.js";
import { CampoTexto } from "../../componentes/CampoTexto/CampoTexto.js";
import { EtiquetaEstado } from "../../componentes/EtiquetaEstado/EtiquetaEstado.js";
import { Icono } from "../../componentes/Icono/Icono.js";
import { IndicadorCarga } from "../../componentes/IndicadorCarga/IndicadorCarga.js";
import { mostrarNotificacion } from "../../componentes/Notificacion/Notificacion.js";
import { PanelError } from "../../componentes/Error/PanelError.js";
import { SelectorPeriodo } from "../../componentes/SelectorFecha/SelectorFecha.js";
import { crearControladorAsistencia } from "./controladores/controladorAsistencia.js";
import { generarReportePdf } from "../reportes/servicios/servicioReportes.js";

const nombresMes = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const nombresDia = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function textoPeriodo(anio, mes) {
  return `${nombresMes[Number(mes) - 1]} ${anio}`;
}

function formatearFechaDetalle(fechaIso) {
  const fecha = new Date(`${fechaIso}T00:00:00`);

  return {
    dia: nombresDia[fecha.getDay()],
    detalle: new Intl.DateTimeFormat("es-BO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(fecha),
  };
}

function formatearHoraMarcacion(valor) {
  if (!valor) {
    return "--:--";
  }

  const coincidencia = String(valor).match(/(\d{2}):(\d{2})/);
  return coincidencia ? `${coincidencia[1]}:${coincidencia[2]}` : "--:--";
}

function convertirMarcacionAMinutos(valor) {
  const hora = formatearHoraMarcacion(valor);

  if (hora === "--:--") {
    return null;
  }

  const [horas, minutos] = hora.split(":").map(Number);
  return horas * 60 + minutos;
}

function convertirMarcacionAMinutosJornada(valor, fechaJornada) {
  const minutos = convertirMarcacionAMinutos(valor);

  if (minutos === null) {
    return null;
  }

  const fechaMarcacion = String(valor ?? "").slice(0, 10);

  if (fechaMarcacion > fechaJornada) {
    return minutos + 1440;
  }

  if (fechaMarcacion < fechaJornada) {
    return minutos - 1440;
  }

  return minutos;
}

function obtenerResultadosOrdenados(asistencia) {
  return (asistencia.resultados_marcaciones ?? [])
    .filter(
      (resultado) => resultado?.estado || resultado?.hora_objetivo || resultado?.fecha_marcacion,
    )
    .sort((a, b) => {
      const ordenA = Number(a.marcaciones_esperadas?.orden ?? 999);
      const ordenB = Number(b.marcaciones_esperadas?.orden ?? 999);

      return ordenA - ordenB;
    })
    .slice(0, 4);
}

function calcularMinutosTrabajados(asistencia) {
  const minutos = obtenerResultadosOrdenados(asistencia)
    .map((resultado) => convertirMarcacionAMinutosJornada(resultado.fecha_marcacion, asistencia.fecha))
    .filter((valor) => valor !== null);

  let total = 0;
  for (let indice = 0; indice < minutos.length; indice += 2) {
    const entrada = minutos[indice];
    const salida = minutos[indice + 1];

    if (entrada !== undefined && salida !== undefined && salida >= entrada) {
      total += salida - entrada;
    }
  }

  return total;
}

function formatearMinutosComoHora(minutos) {
  const horas = Math.floor(Number(minutos || 0) / 60);
  const resto = Number(minutos || 0) % 60;

  return `${String(horas).padStart(2, "0")}:${String(resto).padStart(2, "0")}`;
}

function textoEstado(estado) {
  const mapa = {
    PUNTUAL: "Regular",
    ATRASO: "Retraso",
    OMISION: "Omisión",
    FALTA: "Falta",
    NO_LABORAL: "No laboral",
  };

  return mapa[estado] ?? estado;
}

function claseFilaAsistencia(estado) {
  const mapa = {
    ATRASO: "fila-asistencia--retraso",
    OMISION: "fila-asistencia--omision",
    FALTA: "fila-asistencia--falta",
    NO_LABORAL: "fila-asistencia--no-laboral",
  };

  return mapa[estado] ?? "";
}

function crearMetrica({ titulo, valor, detalle, icono, variante }) {
  return crearElemento(
    "article",
    { clases: ["metrica-asistencia", `metrica-asistencia--${variante}`] },
    [
      crearElemento("div", { clases: "metrica-asistencia__texto" }, [
        crearElemento("span", { texto: titulo }),
        crearElemento("strong", { texto: valor }),
        crearElemento("small", { texto: detalle }),
      ]),
      crearElemento("span", { clases: "metrica-asistencia__icono" }, [Icono({ nombre: icono })]),
    ],
  );
}

function crearFichaFuncionario(resultado, alExportar, puedeExportar, estaExportando) {
  const { funcionario } = resultado;

  return crearElemento("section", { clases: "panel-funcionario" }, [
    crearElemento("div", { clases: "panel-funcionario__avatar" }, [
      Icono({ nombre: "funcionario" }),
    ]),
    crearElemento("div", { clases: "panel-funcionario__datos" }, [
      crearElemento("h3", { texto: funcionario.nombre_completo }),
      crearElemento("p", {
        texto: `${funcionario.cargos?.nombre ?? "Sin cargo"} • ${funcionario.unidades?.nombre ?? "Sin unidad"} • CI: ${funcionario.carnet_identidad}`,
      }),
    ]),
    Boton({
      texto: estaExportando ? "Exportando..." : "Exportar Reporte PDF",
      icono: "descargar",
      deshabilitado: estaExportando || !puedeExportar,
      titulo: puedeExportar ? "Exportar Reporte PDF" : "No tienes permiso para generar reportes",
      alClick: alExportar,
    }),
  ]);
}

function crearMetricas(resultado, anio, mes) {
  const totalHoras = resultado.asistencias.reduce(
    (total, asistencia) => total + calcularMinutosTrabajados(asistencia),
    0,
  );

  return crearElemento("section", { clases: "metricas-asistencia" }, [
    crearMetrica({
      titulo: "Total horas",
      valor: formatearMinutosComoHora(totalHoras),
      detalle: textoPeriodo(anio, mes),
      icono: "reloj",
      variante: "horas",
    }),
    crearMetrica({
      titulo: "Faltas",
      valor: String(resultado.totales.cantidad_faltas),
      detalle: "Días enteros",
      icono: "calendario",
      variante: "faltas",
    }),
    crearMetrica({
      titulo: "Omisiones",
      valor: String(resultado.totales.cantidad_omisiones),
      detalle: "Marcados faltantes",
      icono: "reporte",
      variante: "omisiones",
    }),
    crearMetrica({
      titulo: "Retrasos",
      valor: String(resultado.totales.cantidad_atrasos),
      detalle: `Acumulan ${formatearMinutos(resultado.totales.minutos_atraso)}`,
      icono: "reloj",
      variante: "retrasos",
    }),
    crearMetrica({
      titulo: "Horas extra",
      valor: formatearMinutos(resultado.totales.minutos_hora_extra),
      detalle: `Tolerancia aplicada ${formatearMinutos(resultado.totales.tolerancia_horas_extra)}`,
      icono: "extra",
      variante: "extras",
    }),
  ]);
}

function crearCeldaHora(resultado) {
  const tieneAtraso = Number(resultado?.minutos_atraso ?? 0) > 0;

  return crearElemento(
    "td",
    {
      clases: tieneAtraso ? "hora-marcacion hora-marcacion--alerta" : "hora-marcacion",
      atributos: resultado?.hora_objetivo
        ? { title: `Programado ${formatearHoraMarcacion(resultado.hora_objetivo)}` }
        : null,
    },
    [document.createTextNode(formatearHoraMarcacion(resultado?.fecha_marcacion))],
  );
}

function crearTablaDetalle(asistencias, filtroDetalle) {
  const filtro = String(filtroDetalle ?? "")
    .trim()
    .toLowerCase();
  const filas = asistencias.filter((asistencia) => {
    if (!filtro) {
      return true;
    }

    const fecha = formatearFechaDetalle(asistencia.fecha);
    return `${fecha.dia} ${fecha.detalle} ${asistencia.fecha} ${textoEstado(asistencia.estado)}`
      .toLowerCase()
      .includes(filtro);
  });

  return crearElemento("div", { clases: "tabla-asistencia" }, [
    crearElemento("table", {}, [
      crearElemento("thead", {}, [
        crearElemento(
          "tr",
          {},
          [
            "Fecha",
            "Ingreso 1",
            "Salida 1",
            "Ingreso 2",
            "Salida 2",
            "Horas",
            "Extra",
            "Tolerancia",
            "Estado",
            "Detalle",
          ].map((titulo) => crearElemento("th", { texto: titulo })),
        ),
      ]),
      crearElemento(
        "tbody",
        {},
        filas.map((asistencia) => {
          const fecha = formatearFechaDetalle(asistencia.fecha);
          const marcaciones = obtenerResultadosOrdenados(asistencia);
          const minutosTrabajados = calcularMinutosTrabajados(asistencia);

          while (marcaciones.length < 4) {
            marcaciones.push(null);
          }

          return crearElemento("tr", { clases: claseFilaAsistencia(asistencia.estado) }, [
            crearElemento("td", { clases: "fecha-asistencia" }, [
              crearElemento("strong", { texto: fecha.dia }),
              crearElemento("span", { texto: fecha.detalle }),
            ]),
            crearCeldaHora(marcaciones[0]),
            crearCeldaHora(marcaciones[1]),
            crearCeldaHora(marcaciones[2]),
            crearCeldaHora(marcaciones[3]),
            crearElemento("td", {
              clases: "horas-asistencia",
              texto: formatearMinutosComoHora(minutosTrabajados),
            }),
            crearElemento("td", {
              clases: "horas-asistencia",
              texto: Number(asistencia.minutos_hora_extra ?? 0)
                ? formatearMinutos(asistencia.minutos_hora_extra)
                : "--",
            }),
            crearElemento("td", {
              clases: "horas-asistencia",
              texto: Number(asistencia.tolerancia_horas_extra ?? 0)
                ? formatearMinutos(asistencia.tolerancia_horas_extra)
                : "--",
            }),
            crearElemento("td", {}, [
              EtiquetaEstado({ estado: asistencia.estado, texto: textoEstado(asistencia.estado) }),
            ]),
            crearElemento("td", {
              clases: "detalle-asistencia",
              texto: asistencia.explicacion?.resumen ?? "Sin detalle",
            }),
          ]);
        }),
      ),
    ]),
    !filas.length
      ? crearElemento("div", {
          clases: "tabla-asistencia__vacio",
          texto: "Sin registros para el filtro seleccionado.",
        })
      : null,
  ]);
}

export function PaginaAsistencia({ envolverProtegida, ruta, usuarioActual } = {}) {
  const controlador = crearControladorAsistencia();
  const estadoVista = {
    filtroDetalle: "",
    estaExportando: false,
  };
  const contenedor = crearElemento("main", { clases: "pagina pagina--asistencia" });

  const consultar = async () => {
    await controlador.consultar();
    renderizar();
  };

  const exportarPdf = async () => {
    const { estado } = controlador;

    if (!estado.resultado?.funcionario) {
      return;
    }

    estadoVista.estaExportando = true;
    renderizar();

    try {
      await generarReportePdf({
        carnetIdentidad: estado.resultado.funcionario.carnet_identidad,
        anio: estado.anio,
        mes: estado.mes,
      });
      mostrarNotificacion({
        titulo: "PDF generado",
        mensaje: "El reporte individual se exportó correctamente.",
        tipo: "exito",
      });
    } catch (error) {
      controlador.estado.error = traducirError(error);
    } finally {
      estadoVista.estaExportando = false;
      renderizar();
    }
  };

  function renderizarResultado() {
    const { estado } = controlador;
    const { resultado } = estado;

    if (!resultado) {
      return crearElemento("section", { clases: "panel-inicial-asistencia" }, [
        crearElemento("strong", {
          texto: "Busca un funcionario para ver su tablero de asistencia.",
        }),
        crearElemento("span", {
          texto:
            "La vista combina resumen, faltas, omisiones, retrasos, detalle diario y exportación PDF.",
        }),
      ]);
    }

    if (!resultado.funcionario) {
      return PanelError({
        titulo: "Funcionario no encontrado",
        detalle: "Verifica el CI o crea el funcionario desde el módulo Funcionarios.",
      });
    }

    const puedeExportar = usuarioTienePermisoLocal(usuarioActual, "reportes.generar");

    return crearElemento("section", { clases: "tablero-asistencia" }, [
      crearFichaFuncionario(resultado, exportarPdf, puedeExportar, estadoVista.estaExportando),
      crearMetricas(resultado, estado.anio, estado.mes),
      crearElemento("section", { clases: "detalle-panel-asistencia" }, [
        crearElemento("div", { clases: "detalle-panel-asistencia__cabecera" }, [
          crearElemento("h3", { texto: "Registro detallado" }),
          CampoTexto({
            id: "buscar-fecha-asistencia",
            marcador: "Buscar fecha...",
            valor: estadoVista.filtroDetalle,
            alCambiar: (valor) => {
              estadoVista.filtroDetalle = valor;
              renderizar();
            },
          }),
        ]),
        crearTablaDetalle(resultado.asistencias, estadoVista.filtroDetalle),
        crearElemento("p", {
          clases: "texto-ayuda",
          texto: `Mostrando ${resultado.asistencias.length} registros de ${textoPeriodo(estado.anio, estado.mes)}.`,
        }),
      ]),
    ]);
  }

  function renderizar() {
    const { estado } = controlador;
    limpiarNodo(contenedor);

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

    const elementos = [
      crearElemento("section", { clases: "pagina__cabecera" }, [
        crearElemento("div", { clases: "pagina__titulo" }, [
          crearElemento("h2", { texto: "Asistencia individual" }),
          crearElemento("p", {
            texto: "Consulta, resumen operativo, detalle diario y reporte PDF en una sola vista.",
          }),
        ]),
      ]),
      crearElemento("section", { clases: "buscador-asistencia" }, [
        CampoTexto({
          id: "carnet-identidad",
          etiqueta: "Carnet de identidad",
          marcador: "Ej. 12346950",
          valor: estado.carnetIdentidad,
          requerido: true,
          alCambiar: (valor) => controlador.establecerCarnet(valor),
        }),
        crearElemento("div", { clases: "buscador-asistencia__periodo" }, selectoresPeriodo),
        Boton({
          texto: estado.estaCargando ? "Consultando..." : "Consultar",
          icono: "buscar",
          deshabilitado: estado.estaCargando,
          alClick: consultar,
        }),
      ]),
      estado.error ? PanelError({ detalle: estado.error }) : null,
      estado.estaCargando ? IndicadorCarga({ texto: "Consultando asistencia..." }) : null,
      renderizarResultado(),
    ].filter(Boolean);

    contenedor.append(...elementos);
  }

  renderizar();
  return envolverProtegida(contenedor, ruta);
}
