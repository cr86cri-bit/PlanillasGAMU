import { crearElemento } from "../../utilidades/dom.js";
import { Tarjeta } from "../../componentes/Tarjeta/Tarjeta.js";

const resumenes = [
  ["Funcionarios activos", "Gestión por CI, unidad, cargo y código biométrico."],
  ["Importaciones", "Lectura de Excel por lotes con previsualización y duplicados."],
  ["Incidencias", "Retrasos, omisiones, faltas, feriados y excepciones auditables."],
  ["Reportes", "PDF individual con responsable configurable."],
];

export function PaginaInicio({ envolverProtegida, ruta } = {}) {
  const pagina = crearElemento("main", { clases: "pagina" }, [
    crearElemento("section", { clases: "pagina__cabecera" }, [
      crearElemento("div", { clases: "pagina__titulo" }, [
        crearElemento("h2", { texto: "Panel principal" }),
        crearElemento("p", {
          texto: "Vista operativa para controlar asistencia institucional con trazabilidad.",
        }),
      ]),
    ]),
    crearElemento(
      "section",
      { clases: "grilla-resumen" },
      resumenes.map(([titulo, detalle]) =>
        Tarjeta({
          titulo,
          cuerpo: [crearElemento("p", { clases: "texto-suave", texto: detalle })],
        }),
      ),
    ),
    Tarjeta({
      titulo: "Flujo recomendado",
      cuerpo: [
        crearElemento("ol", {}, [
          crearElemento("li", { texto: "Configurar unidades, cargos, horarios y feriados." }),
          crearElemento("li", {
            texto: "Registrar o vincular funcionarios con su código biométrico.",
          }),
          crearElemento("li", {
            texto: "Importar el Excel mensual por unidad y validar desconocidos.",
          }),
          crearElemento("li", { texto: "Recalcular asistencia y generar el reporte individual." }),
        ]),
      ],
    }),
  ]);

  return envolverProtegida(pagina, ruta);
}
