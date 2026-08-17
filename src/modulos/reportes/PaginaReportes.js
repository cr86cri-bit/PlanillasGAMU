import { crearElemento, limpiarNodo } from "../../utilidades/dom.js";
import { Boton } from "../../componentes/Boton/Boton.js";
import { CampoTexto } from "../../componentes/CampoTexto/CampoTexto.js";
import { IndicadorCarga } from "../../componentes/IndicadorCarga/IndicadorCarga.js";
import { mostrarNotificacion } from "../../componentes/Notificacion/Notificacion.js";
import { PanelError } from "../../componentes/Error/PanelError.js";
import { SelectorPeriodo } from "../../componentes/SelectorFecha/SelectorFecha.js";
import { Tarjeta } from "../../componentes/Tarjeta/Tarjeta.js";
import { traducirError } from "../../nucleo/errores/manejadorErrores.js";
import { generarReportePdf } from "./servicios/servicioReportes.js";

export function PaginaReportes({ envolverProtegida, ruta } = {}) {
  const fecha = new Date();
  const estado = {
    carnetIdentidad: "",
    anio: fecha.getFullYear(),
    mes: fecha.getMonth() + 1,
    estaCargando: false,
    error: null,
  };
  const contenedor = crearElemento("main", { clases: "pagina" });

  const generar = async () => {
    const carnetIdentidad = String(estado.carnetIdentidad ?? "").trim();

    if (!carnetIdentidad) {
      estado.error = "Ingresa el carnet de identidad antes de generar el PDF.";
      renderizar();
      return;
    }

    estado.carnetIdentidad = carnetIdentidad;
    estado.estaCargando = true;
    estado.error = null;
    renderizar();

    try {
      await generarReportePdf({
        carnetIdentidad,
        anio: estado.anio,
        mes: estado.mes,
      });
      mostrarNotificacion({
        titulo: "PDF generado",
        mensaje: "El reporte individual se generó correctamente.",
        tipo: "exito",
      });
    } catch (error) {
      estado.error = traducirError(error);
    } finally {
      estado.estaCargando = false;
      renderizar();
    }
  };

  function renderizar() {
    limpiarNodo(contenedor);
    const selectoresPeriodo = SelectorPeriodo({
      anio: estado.anio,
      mes: estado.mes,
      alCambiarAnio: (valor) => {
        estado.anio = Number(valor);
      },
      alCambiarMes: (valor) => {
        estado.mes = Number(valor);
      },
    });

    contenedor.append(
      crearElemento("section", { clases: "pagina__cabecera" }, [
        crearElemento("div", { clases: "pagina__titulo" }, [
          crearElemento("h2", { texto: "Reporte PDF individual" }),
          crearElemento("p", {
            texto: "El reporte se genera únicamente para el funcionario consultado por CI.",
          }),
        ]),
      ]),
      Tarjeta({
        titulo: "Generar PDF",
        cuerpo: [
          crearElemento("div", { clases: "formulario" }, [
            CampoTexto({
              id: "ci-reporte",
              etiqueta: "Carnet de identidad",
              valor: estado.carnetIdentidad,
              alCambiar: (valor) => {
                estado.carnetIdentidad = valor;
                estado.error = null;
              },
            }),
            crearElemento("div", { clases: "formulario__fila" }, selectoresPeriodo),
            estado.error ? PanelError({ detalle: estado.error }) : null,
            estado.estaCargando ? IndicadorCarga({ texto: "Generando PDF..." }) : null,
          ]),
        ],
        pie: Boton({
          texto: "Generar PDF",
          deshabilitado: estado.estaCargando,
          alClick: generar,
        }),
      }),
    );
  }

  renderizar();
  return envolverProtegida(contenedor, ruta);
}
