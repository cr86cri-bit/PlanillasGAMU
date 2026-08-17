import { crearElemento, limpiarNodo, textoSeguro } from "../../utilidades/dom.js";
import { crearAntirebote } from "../../utilidades/consultas.js";
import { traducirError } from "../../nucleo/errores/manejadorErrores.js";
import { BarraFiltros } from "../../componentes/BarraFiltros/BarraFiltros.js";
import { Boton } from "../../componentes/Boton/Boton.js";
import { EtiquetaEstado } from "../../componentes/EtiquetaEstado/EtiquetaEstado.js";
import { IndicadorCarga } from "../../componentes/IndicadorCarga/IndicadorCarga.js";
import { Modal } from "../../componentes/Modal/Modal.js";
import { mostrarNotificacion } from "../../componentes/Notificacion/Notificacion.js";
import { PanelError } from "../../componentes/Error/PanelError.js";
import { TablaDatos } from "../../componentes/TablaDatos/TablaDatos.js";
import { Tarjeta } from "../../componentes/Tarjeta/Tarjeta.js";
import { crearControladorHorarios } from "./controladores/controladorHorarios.js";

const nombresDias = {
  1: "Lun",
  2: "Mar",
  3: "Mié",
  4: "Jue",
  5: "Vie",
  6: "Sáb",
  7: "Dom",
};

function crearCampo({ clave, etiqueta, valor = "", requerido = false }) {
  const idCampo = `${clave}-${crypto.randomUUID()}`;
  return crearElemento("div", { clases: "campo" }, [
    crearElemento("label", { atributos: { for: idCampo }, texto: etiqueta }),
    crearElemento("input", {
      atributos: { id: idCampo, name: clave, required: requerido, value: valor ?? "" },
    }),
  ]);
}

function crearSelector({ clave, etiqueta, valor = "", opciones = [] }) {
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
            selected: String(opcion.valor) === String(valor),
          },
        }),
      ),
    ),
  ]);
}

function valorFormulario(formulario, clave) {
  return String(formulario.elements.namedItem(clave)?.value ?? "").trim();
}

function formatearHora(valor) {
  const coincidencia = String(valor ?? "").match(/(\d{2}):(\d{2})/);
  return coincidencia ? `${coincidencia[1]}:${coincidencia[2]}` : "--:--";
}

function compactarDias(dias) {
  const ordenados = [...dias].sort((a, b) => a - b);

  if (ordenados.join(",") === "1,2,3,4,5") {
    return "Lun-Vie";
  }

  if (ordenados.join(",") === "1,2,3,4,5,6") {
    return "Lun-Sáb";
  }

  return ordenados.map((dia) => nombresDias[dia] ?? String(dia)).join(", ");
}

function obtenerMarcacionesOrdenadas(regla) {
  return (regla.marcaciones_esperadas ?? [])
    .slice()
    .sort((a, b) => Number(a.orden ?? 0) - Number(b.orden ?? 0));
}

function crearFirmaRegla(regla) {
  return obtenerMarcacionesOrdenadas(regla)
    .map(
      (marcacion) =>
        `${marcacion.orden}:${marcacion.tipo}:${formatearHora(marcacion.hora_objetivo)}`,
    )
    .join("|");
}

function agruparReglasHorario(horario) {
  const grupos = new Map();

  (horario.reglas_dia_horario ?? [])
    .filter((regla) => regla.es_laboral)
    .forEach((regla) => {
      const marcaciones = obtenerMarcacionesOrdenadas(regla);

      if (!marcaciones.length) {
        return;
      }

      const firma = crearFirmaRegla(regla);
      const grupo =
        grupos.get(firma) ??
        {
          dias: [],
          marcaciones: marcaciones.map((marcacion) => ({
            tipo: marcacion.tipo,
            orden: marcacion.orden,
            hora_objetivo: marcacion.hora_objetivo,
            ids: [],
          })),
        };

      grupo.dias.push(Number(regla.dia_semana));
      marcaciones.forEach((marcacion, indice) => {
        grupo.marcaciones[indice]?.ids.push(marcacion.id_marcacion_esperada);
      });
      grupos.set(firma, grupo);
    });

  return [...grupos.values()].sort((a, b) => Math.min(...a.dias) - Math.min(...b.dias));
}

function renderizarHorariosEsperados(horario) {
  const lineas = agruparReglasHorario(horario).map((grupo) =>
    crearElemento("span", {
      texto: `${compactarDias(grupo.dias)}: ${grupo.marcaciones
        .map((marcacion) => {
          const tipo = marcacion.tipo === "ENTRADA" ? "Entrada" : "Salida";
          return `${tipo} ${formatearHora(marcacion.hora_objetivo)}`;
        })
        .join(" · ")}`,
    }),
  );

  if (!lineas.length) {
    return crearElemento("span", { texto: "Sin marcaciones configuradas" });
  }

  return crearElemento("div", { clases: "horario-resumen" }, lineas);
}

function crearEditorMarcaciones(horario) {
  const grupos = agruparReglasHorario(horario);

  if (!horario) {
    return crearElemento("p", {
      clases: "texto-ayuda",
      texto: "Crea la plantilla y luego edita sus entradas y salidas.",
    });
  }

  if (!grupos.length) {
    return crearElemento("p", {
      clases: "texto-ayuda",
      texto: "Esta plantilla todavía no tiene marcaciones esperadas configuradas.",
    });
  }

  return crearElemento("section", { clases: "editor-horario" }, [
    crearElemento("div", { clases: "editor-horario__cabecera" }, [
      crearElemento("h3", { texto: "Entradas y salidas" }),
      crearElemento("p", {
        texto: "Modifica las horas programadas. Los días agrupados se actualizan juntos.",
      }),
    ]),
    ...grupos.map((grupo) =>
      crearElemento("div", { clases: "editor-horario__grupo" }, [
        crearElemento("strong", { texto: compactarDias(grupo.dias) }),
        crearElemento(
          "div",
          { clases: "editor-horario__campos" },
          grupo.marcaciones.map((marcacion, indice) => {
            const idCampo = `marcacion-${indice}-${crypto.randomUUID()}`;
            const tipo = marcacion.tipo === "ENTRADA" ? "Entrada" : "Salida";
            const entrada = crearElemento("input", {
              atributos: {
                id: idCampo,
                type: "time",
                value: formatearHora(marcacion.hora_objetivo),
                required: true,
              },
            });

            entrada.dataset.idsMarcaciones = marcacion.ids.join(",");

            return crearElemento("div", { clases: "campo" }, [
              crearElemento("label", { atributos: { for: idCampo }, texto: `${tipo} ${indice + 1}` }),
              entrada,
            ]);
          }),
        ),
      ]),
    ),
  ]);
}

function leerMarcacionesFormulario(formulario) {
  return [...formulario.querySelectorAll("[data-ids-marcaciones]")].flatMap((entrada) =>
    String(entrada.dataset.idsMarcaciones ?? "")
      .split(",")
      .filter(Boolean)
      .map((idMarcacion) => ({
        id_marcacion_esperada: idMarcacion,
        hora_objetivo: entrada.value,
      })),
  );
}

export function PaginaHorarios({ envolverProtegida, ruta } = {}) {
  const controlador = crearControladorHorarios();
  const contenedor = crearElemento("main", { clases: "pagina" });

  const cargar = async () => {
    await controlador.cargarHorarios();
    renderizar();
  };

  const buscarConEspera = crearAntirebote((valor) => {
    controlador.establecerBusqueda(valor);
    cargar();
  });

  const guardarHorario = async (formulario, modal, horario = null) => {
    try {
      await controlador.guardarHorario(
        {
          nombre: valorFormulario(formulario, "nombre"),
          tipo: valorFormulario(formulario, "tipo"),
          alcance: valorFormulario(formulario, "alcance"),
          descripcion: valorFormulario(formulario, "descripcion"),
          activo: valorFormulario(formulario, "activo") === "true",
        },
        horario,
        horario ? leerMarcacionesFormulario(formulario) : [],
      );
      modal.remove();
      mostrarNotificacion({
        titulo: horario ? "Horario actualizado" : "Horario creado",
        mensaje: "La plantilla se guardó correctamente.",
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

  const abrirFormulario = (horario = null) => {
    const formulario = crearElemento("form", { clases: "formulario" }, [
      crearCampo({ clave: "nombre", etiqueta: "Nombre", requerido: true, valor: horario?.nombre }),
      crearSelector({
        clave: "tipo",
        etiqueta: "Tipo",
        valor: horario?.tipo ?? "REGULAR",
        opciones: [
          { valor: "REGULAR", etiqueta: "Regular" },
          { valor: "HORARIO_CONTINUO", etiqueta: "Horario continuo" },
          { valor: "LIMPIEZA", etiqueta: "Limpieza" },
          { valor: "RECOLECCION_BASURA", etiqueta: "Recoleccion de basura" },
        ],
      }),
      crearSelector({
        clave: "alcance",
        etiqueta: "Alcance",
        valor: horario?.alcance ?? "GENERAL",
        opciones: [
          { valor: "GENERAL", etiqueta: "General" },
          { valor: "UNIDAD", etiqueta: "Por unidad" },
          { valor: "INDIVIDUAL", etiqueta: "Individual" },
        ],
      }),
      crearCampo({ clave: "descripcion", etiqueta: "Descripcion", valor: horario?.descripcion }),
      crearSelector({
        clave: "activo",
        etiqueta: "Estado",
        valor: horario?.activo ?? true,
        opciones: [
          { valor: true, etiqueta: "Activo" },
          { valor: false, etiqueta: "Inactivo" },
        ],
      }),
      crearEditorMarcaciones(horario),
    ]);

    let modal;
    formulario.addEventListener("submit", async (evento) => {
      evento.preventDefault();
      await guardarHorario(formulario, modal, horario);
    });

    modal = Modal({
      titulo: horario ? "Editar plantilla" : "Nueva plantilla",
      cuerpo: [
        formulario,
      ],
      pie: [
        Boton({ texto: "Cancelar", variante: "secundario", alClick: () => modal.remove() }),
        Boton({ texto: "Guardar", icono: "✓", alClick: () => formulario.requestSubmit() }),
      ],
    });
  };

  function renderizar() {
    const { estado } = controlador;
    limpiarNodo(contenedor);
    contenedor.append(
      crearElemento("section", { clases: "pagina__cabecera" }, [
        crearElemento("div", { clases: "pagina__titulo" }, [
          crearElemento("h2", { texto: "Horarios" }),
          crearElemento("p", {
            texto: "Plantillas configurables con reglas por día, ventanas, tolerancias y vigencia.",
          }),
        ]),
        Boton({
          texto: "Nueva plantilla",
          icono: "+",
          variante: "primario",
          alClick: () => abrirFormulario(),
        }),
      ]),
      BarraFiltros({
        valorBusqueda: estado.busqueda,
        alBuscar: buscarConEspera,
        alLimpiar: cargar,
      }),
      estado.estaCargando
        ? IndicadorCarga({ texto: "Cargando horarios..." })
        : estado.error
          ? PanelError({ detalle: estado.error })
          : Tarjeta({
              titulo: `${estado.total} plantillas`,
              cuerpo: [
                TablaDatos({
                  filas: estado.filas,
                  obtenerClave: (fila) => fila.id_horario,
                  mensajeVacio: "Sin plantillas de horario",
                  columnas: [
                    { titulo: "Nombre", clave: "nombre" },
                    { titulo: "Tipo", clave: "tipo" },
                    { titulo: "Alcance", renderizar: (fila) => textoSeguro(fila.alcance) },
                    {
                      titulo: "Entradas y salidas",
                      renderizar: (fila) => renderizarHorariosEsperados(fila),
                    },
                    { titulo: "Descripción", renderizar: (fila) => textoSeguro(fila.descripcion) },
                    {
                      titulo: "Estado",
                      renderizar: (fila) =>
                        EtiquetaEstado({ estado: fila.activo ? "ACTIVO" : "INACTIVO" }),
                    },
                    {
                      titulo: "Acciones",
                      renderizar: (fila) =>
                        crearElemento("div", { clases: "acciones acciones--tabla" }, [
                          Boton({
                            texto: "Editar",
                            variante: "secundario",
                            alClick: () => abrirFormulario(fila),
                          }),
                        ]),
                    },
                  ],
                }),
              ],
            }),
    );
  }

  renderizar();
  cargar();
  return envolverProtegida(contenedor, ruta);
}
